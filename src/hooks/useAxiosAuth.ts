"use client";

import { useEffect } from "react";
import { axiosAuth } from "@/config/axios";
import { useAuthStore } from "@/lib/stores/auth-store";

export default function useAxiosAuth() {
  useEffect(() => {
    const requestIntercept = axiosAuth.interceptors.request.use(
      (config) => {
        const session = useAuthStore.getState().session;

        if (session?.access_token && !config.headers["Authorization"]) {
          config.headers["Authorization"] = `Bearer ${session.access_token}`;
        }
        if (session?.pay_token && !config.headers["X-Pay-Token"]) {
          config.headers["X-Pay-Token"] = session.pay_token;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    return () => {
      axiosAuth.interceptors.request.eject(requestIntercept);
    };
  }, []);

  return axiosAuth;
}
