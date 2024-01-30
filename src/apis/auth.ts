import { User } from "..";
import { AUTH_DOMAIN, DASIOT_API_DOMAIN } from "../env";

export const login = async (username: string, password: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append("username", username);
  urlencoded.append("password", password);
  urlencoded.append("grant_type", "password");
  urlencoded.append("client_id", "dasiot-app-dsm-frontend");
  return fetch(
    `${AUTH_DOMAIN}/auth/realms/dasiot/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded.toString(),
    }
  ).then((res) => {
    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json() as Promise<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      refresh_expires_in: number;
    }>;
  });
};

export const logout = async (accessToken: string, refreshToken: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", "dasiot-app-dsm-frontend");
  urlencoded.append("refresh_token", refreshToken);
  return fetch(
    `${AUTH_DOMAIN}/auth/realms/dasiot/protocol/openid-connect/logout`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded.toString(),
    }
  );
};

export const refresh = async (refreshToken: string) => {
  const urlencoded = new URLSearchParams();
  urlencoded.append("client_id", "dasiot-app-dsm-frontend");
  urlencoded.append("grant_type", "refresh_token");
  urlencoded.append("refresh_token", refreshToken);
  return fetch(
    `${AUTH_DOMAIN}/auth/realms/dasiot/protocol/openid-connect/token`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: urlencoded.toString(),
    }
  ).then((res) => {
    if (!res.ok) {
      throw new Error(res.statusText);
    }

    return res.json() as Promise<{
      access_token: string;
      refresh_token: string;
      expires_in: number;
      refresh_expires_in: number;
    }>;
  });
};

type getMeParams = {
  accessToken: string;
};

export const getMe = (params: getMeParams) => {
  return fetch(`${DASIOT_API_DOMAIN}/v1/me`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json() as Promise<{ data: User }>;
    })
    .then((json) => json.data);
};
