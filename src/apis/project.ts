import { Project } from "..";
import { DASIOT_API_DOMAIN } from "../env";

type GetProjectsParams = {
  accessToken: string;
};

export const getProjects = async (params: GetProjectsParams) => {
  return fetch(`${DASIOT_API_DOMAIN}/v1/projects`, {
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
    },
  })
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json() as Promise<{ data: Project[] }>;
    })
    .then((json) => json.data);
};

type GetDasLoopsParams = {
  projectId: string;
  accessToken: string;
  nextCursor?: string;
};

export const getDasLoops = async (params: GetDasLoopsParams) => {
  const urlencoded = new URLSearchParams();
  if (params.nextCursor) {
    urlencoded.append("nextCursor", params.nextCursor);
  }
  return fetch(
    `${DASIOT_API_DOMAIN}/v1/projects/${
      params.projectId
    }/dasloops${urlencoded.toString() ? "?" + urlencoded.toString() : ""}`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    }
  );
};

type GetProjectLiveCalls = {
  projectId: string;
  accessToken: string;
};

export type LiveCallData = {
  id: string;
  name: string; // Das ID
  maxParticipants: number;
  numParticipants: number;
  createdAt: string;
};

export const getProjectLiveCalls = (params: GetProjectLiveCalls) => {
  return fetch(
    `${DASIOT_API_DOMAIN}/v1/projects/${params.projectId}/live-calls`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
    }
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json() as Promise<{ data: LiveCallData[] }>;
    })
    .then((json) => json.data);
};

type CreateLiveCallCredentials = {
  projectId: string;
  accessToken: string;
  id: string; // Das ID
};

type LiveCallCredentials = {
  token: string;
  iceServers: Array<{
    urls: string;
    username: string;
    credential: string;
  }>;
};

export const createLiveCallCredential = (params: CreateLiveCallCredentials) => {
  return fetch(
    `${DASIOT_API_DOMAIN}/v1/projects/${params.projectId}/live-calls/${params.id}/credentials`,
    {
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
      },
      method: "POST",
    }
  )
    .then((res) => {
      if (!res.ok) {
        throw new Error(res.statusText);
      }

      return res.json() as Promise<{ data: LiveCallCredentials }>;
    })
    .then((json) => json.data);
};
