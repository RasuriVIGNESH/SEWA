package com.vig.sewa_backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.TaskScheduler;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Runs once after Spring context is fully started.
 *
 * Sequence:
 *  1. Check if FHIR is reachable.
 *     → If offline: broadcast "ICU offline" to all WebSocket subscribers and stop.
 *  2. If online:
 *     a. Start the vitals poller (scheduler is already enabled via @EnableScheduling,
 *        but we guard it with a flag so it only runs after this check).
 *     b. In parallel: run FhirSyncService to push missing DB patients to FHIR.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class StartupOrchestrator implements ApplicationRunner {

    private final FhirPatientService   fhirPatientService;
    private final FhirSyncService      fhirSyncService;
    private final FhirPollerService    fhirPollerService;
    private final SimpMessagingTemplate messaging;

    /** Broadcast topic the frontend listens to for system-level status messages. */
    private static final String SYSTEM_TOPIC = "/topic/system/status";

    // ── ENTRY POINT ───────────────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        log.info("=== Startup Orchestrator Begin ===");

        // 1. FHIR reachability check
        boolean fhirOnline = fhirPatientService.isFhirReachable();

        if (!fhirOnline) {
            log.warn("FHIR server is offline. Broadcasting ICU offline status.");
            broadcastFhirStatus(false);
            // Poller stays disabled — fhirPollerService.setPollerEnabled(false) already default
            fhirPollerService.setPollerEnabled(false);
            log.info("=== Startup Orchestrator: poller disabled (ICU offline) ===");
            return;
        }

        // 2. FHIR is online — broadcast online status
        broadcastFhirStatus(true);

        // 3. Enable poller so the @Scheduled method starts working
        fhirPollerService.setPollerEnabled(true);
        log.info("Vitals poller enabled.");

        // 4. Run patient sync in a separate thread so poller isn't delayed
        runSyncAsync();

        log.info("=== Startup Orchestrator Complete ===");
    }

    // ── ASYNC SYNC ────────────────────────────────────────────────────────────

    /**
     * Runs FhirSyncService in a virtual/async thread so it doesn't block
     * the main startup or delay the first poller tick.
     * Uses a plain Thread to avoid requiring @Async infrastructure.
     */
    private void runSyncAsync() {
        Thread thread = new Thread(() -> {
            try {
                log.info("Async FHIR sync started.");
                fhirSyncService.syncOnStartup();
                log.info("Async FHIR sync finished.");
            } catch (Exception e) {
                log.error("Async FHIR sync failed unexpectedly.", e);
            }
        });
        thread.setName("fhir-startup-sync");
        thread.setDaemon(true);
        thread.start();
    }

    // ── WEBSOCKET BROADCAST ───────────────────────────────────────────────────

    private void broadcastFhirStatus(boolean online) {
        SystemStatusMessage msg = new SystemStatusMessage(
                online ? "ICU_ONLINE" : "ICU_OFFLINE",
                online ? "ICU is online. Vitals streaming started."
                        : "ICU is offline. Vitals streaming unavailable.",
                Instant.now()
        );
        try {
            messaging.convertAndSend(SYSTEM_TOPIC, msg);
            log.info("Broadcast system status → {}", msg.status());
        } catch (Exception e) {
            // WebSocket broker may not have subscribers yet on startup — that is fine.
            log.debug("Could not broadcast system status (no subscribers yet): {}", e.getMessage());
        }
    }

    // ── INNER DTO ─────────────────────────────────────────────────────────────

    /**
     * Simple record broadcast to /topic/system/status.
     * Frontend subscribes here to show ICU online/offline banner.
     */
    public record SystemStatusMessage(
            String status,
            String message,
            Instant timestamp
    ) {}
}