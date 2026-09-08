package com.vig.sewa_backend.controller;

import com.vig.sewa_backend.service.FhirPollerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/debug/poller")
@RequiredArgsConstructor
public class PollerDebugController {

    private final FhirPollerService pollerService;

    @GetMapping("/status")
    public ResponseEntity<Map<String,Object>> status() {
        return ResponseEntity.ok(Map.of(
                "pollerEnabled", pollerService.getCachedPatientIds() != null,
                "cachedPatientIds", pollerService.getCachedPatientIds(),
                "processedCount", pollerService.getProcessedCount()
        ));
    }

    @PostMapping("/poll-now")
    public ResponseEntity<String> pollNow() {
        pollerService.pollAndBroadcast();
        return ResponseEntity.ok("Poll triggered");
    }
}
