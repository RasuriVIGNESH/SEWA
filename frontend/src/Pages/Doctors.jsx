import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { Stethoscope, Mail, Phone } from 'lucide-react';
export default function Doctors() {
  const navigate = useNavigate();
  const {
    data: doctors,
    isLoading
  } = useQuery({
    queryKey: ['doctors'],
    queryFn: async () => {
      const response = await api.get('/doctors');
      return response.data;
    }
  });
  return <div className="flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-text-primary">Medical Staff</h1>
          <p className="text-sm text-text-secondary mt-1">Directory of ICU doctors and their assignments</p>
        </div>
        
        <button onClick={() => navigate('/register')} className="flex items-center justify-center gap-2 bg-surface hover:bg-surface-elevated text-text-primary border border-border px-4 py-2 rounded-lg font-medium transition-colors">
          Register New Doctor
        </button>
      </div>

      {isLoading ? <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div> : doctors?.length === 0 ? <div className="flex-1 flex flex-col items-center justify-center bg-surface-elevated/50 rounded-2xl border border-dashed border-border py-16">
          <Stethoscope className="w-12 h-12 text-text-muted mb-4 opacity-50" />
          <h3 className="text-lg font-medium text-text-primary">No Doctors Found</h3>
          <p className="text-sm text-text-secondary mt-1">Please register medical staff.</p>
        </div> : <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {doctors?.map(doctor => <Link key={doctor.id} to={`/doctors/${doctor.id}`} className="bg-surface-elevated rounded-xl border border-border overflow-hidden hover:border-text-muted hover:shadow-lg transition-all group">
              <div className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center text-xl font-bold text-accent group-hover:bg-accent group-hover:text-background transition-colors">
                      {doctor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-text-primary group-hover:text-accent transition-colors">
                        Dr. {doctor.name}
                      </h3>
                      <p className="text-sm text-text-secondary">{doctor.specialization}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Mail className="w-4 h-4 text-text-muted" />
                    <span className="truncate">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-text-secondary">
                    <Phone className="w-4 h-4 text-text-muted" />
                    <span>{doctor.phoneNumber || 'Not provided'}</span>
                  </div>
                </div>
              </div>
              
              <div className="px-5 py-3 bg-surface border-t border-border flex items-center justify-between">
                <div className="flex items-center justify-center gap-1.5 text-xs font-medium text-text-secondary bg-surface-elevated border border-border px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-stable/50"></span>
                  Active Staff
                </div>
                <div className="text-sm text-accent font-medium group-hover:translate-x-1 transition-transform flex items-center">
                  View Profile & Patients <span className="ml-1">→</span>
                </div>
              </div>
            </Link>)}
        </div>}
    </div>;
}