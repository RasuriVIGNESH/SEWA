import publicClient from './publicClient';

export const authApi = {

    async login(email, password) {
        const { data } = await publicClient.post('/api/auth/login', {
            email,
            password
        });

        return {
            token: data.token,
            user: {
                name: data.name,
                doctorId: data.doctorId,
                role: 'Doctor',
            },
        };
    },

    async register({ name, email, password, specialization = '', phoneNumber = '' }) {
        const { data } = await publicClient.post('/api/auth/register', {
            name,
            email,
            password,
            specialization,
            phoneNumber,
        });

        return {
            token: data.token,
            user: {
                name: data.name,
                doctorId: data.doctorId,
                role: 'Doctor',
            },
        };
    },
};