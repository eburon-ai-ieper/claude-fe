import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router";
import { Toaster } from "./components/ui/sonner.tsx";
import { ProtectedRoute } from "./components/ProtectedRoute.tsx";
import TeacherPage from "./pages/TeacherPage.tsx";
import LessonPage from "./pages/LessonPage.tsx";
import TeacherLessonPage from "./pages/TeacherLessonPage.tsx";

const queryClient = new QueryClient();

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <Toaster />
      <Routes>
        <Route path="/" element={<App />} />

        <Route
          path="/super-admin"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
              <h1>SuperAdmin</h1>
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={["TEACHER"]}>
              <TeacherPage />
            </ProtectedRoute>
          }
        ></Route>
        <Route path="/teacher/lessons/:id" element={<TeacherLessonPage />} />
        <Route path="/lessons/:id" element={<LessonPage />} />
      </Routes>
    </BrowserRouter>
  </QueryClientProvider>
);
