import axios from "@/api/axiosInstance";

export const createRoom = (data: { name: string; teacherId: string }) => {
  return axios.post("/teachers/rooms", data);
};
