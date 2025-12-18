import axios from 'axios';

interface LoginBody{
    email: string;
    password: string;
}

export const login = async (body: LoginBody) => {
    console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
    const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/auth/login`, body)
    return response
}