import { useEffect, useRef, useState } from "react";
import "./App.css";
import { getMe, login, logout, refresh } from "./apis/auth";
import {
  LiveCallData,
  createLiveCallCredential,
  getProjectLiveCalls,
  getProjects,
} from "./apis/project";
import { Project, User } from ".";
import LiveCallAgent, { ClientPeer, getLocalStream } from "./LiveCallAgent";
import { LIVE_CALL_HOST } from "./env";

function App() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveCallAgentRef = useRef<LiveCallAgent | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState<
    number | null
  >(null);
  const [liveCallList, setLiveCallList] = useState<LiveCallData[]>([]);
  const [liveCallListIsLoading, setliveCallListIsLoading] = useState(false);
  const [clientPeers, setClientPeers] = useState<ClientPeer[]>([]);

  const handleOnSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (accessToken && refreshToken) {
      try {
        await logout(accessToken, refreshToken);
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("expiresIn");
        localStorage.removeItem("refreshExpiresIn");
        setAccessToken(null);
        setRefreshToken(null);
        setProjects([]);
        setLiveCallList([]);
        setClientPeers([]);
        setUser(null);
      } catch (error) {
        if (error instanceof Error) {
          console.error(error);
        }
      }
    } else {
      try {
        const now = Date.now();
        const data = await login(username, password);
        setAccessToken(data.access_token);
        setRefreshToken(data.refresh_token);
        localStorage.setItem("accessToken", data.access_token);
        localStorage.setItem(
          "expiresIn",
          (now + data.expires_in * 1000).toString()
        );
        localStorage.setItem("refreshToken", data.refresh_token);
        localStorage.setItem(
          "refreshExpiresIn",
          (now + data.refresh_expires_in * 1000).toString()
        );
      } catch (error) {
        if (error instanceof Error) {
          console.error(error);
        }
      }
    }
  };

  useEffect(() => {
    const aToken = localStorage.getItem("accessToken");
    const rToken = localStorage.getItem("refreshToken");
    const expiresIn = localStorage.getItem("expiresIn");
    const refreshExpiresIn = localStorage.getItem("refreshExpiresIn");
    const now = Date.now();

    if (aToken && rToken) {
      if (expiresIn) {
        if (now <= parseInt(expiresIn)) {
          setAccessToken(aToken);
          setRefreshToken(rToken);
        } else {
          if (refreshExpiresIn && now < parseInt(refreshExpiresIn)) {
            refresh(rToken)
              .then((data) => {
                setAccessToken(data.access_token);
                setRefreshToken(data.refresh_token);
                localStorage.setItem("accessToken", data.access_token);
                localStorage.setItem(
                  "expiresIn",
                  (now + data.expires_in * 1000).toString()
                );
                localStorage.setItem("refreshToken", data.refresh_token);
                localStorage.setItem(
                  "refreshExpiresIn",
                  (now + data.refresh_expires_in * 1000).toString()
                );
              })
              .catch((error) => {
                if (error instanceof Error) {
                  console.error(error);
                }
              });
          } else {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("expiresIn");
            localStorage.removeItem("refreshExpiresIn");
          }
        }
      }
    }
  }, []);

  useEffect(() => {
    if (accessToken) {
      getProjects({ accessToken })
        .then((data) => {
          setProjects(data);
        })
        .catch((error) => {
          if (error instanceof Error) {
            console.error(error);
          }
        });
      getMe({ accessToken })
        .then((data) => setUser(data))
        .catch((error) => {
          if (error instanceof Error) {
            console.error(error);
          }
        });
    }
  }, [accessToken]);

  useEffect(() => {
    if (projects.length > 0 && projects[selectedProjectIndex ?? -1]) {
      setliveCallListIsLoading(true);
      if (accessToken) {
        setliveCallListIsLoading(true);
        const project = projects[selectedProjectIndex as number];
        getProjectLiveCalls({
          accessToken,
          projectId: project.id,
        })
          .then((liveCalls) => {
            setLiveCallList(liveCalls);
            setliveCallListIsLoading(false);
          })
          .catch((error) => {
            if (error instanceof Error) {
              console.error(error);
            }
          });
      }
    }
  }, [accessToken, projects, selectedProjectIndex]);

  const projectItems = projects.map((p, i) => {
    return (
      <li
        key={`project-item-${p.id}`}
        onClick={() => setSelectedProjectIndex(i)}
      >
        {p.name}
      </li>
    );
  });

  const liveCallListItems = liveCallList.map((liveCall) => {
    return (
      <li
        key={`liveCallDasLoop-item-${liveCall.name}`}
        onClick={() => connectLiveCall(liveCall.name)}
      >
        <code>
          {liveCall.name}: {liveCall.numParticipants}/{liveCall.maxParticipants}{" "}
          in the room
        </code>
      </li>
    );
  });

  const connectLiveCall = async (dasId: string) => {
    localStreamRef.current = await getLocalStream({
      video: false,
      audio: true,
    });
    const project = projects[selectedProjectIndex ?? -1];
    if (project && accessToken && user) {
      const credentials = await createLiveCallCredential({
        accessToken,
        projectId: project.id,
        id: dasId,
      });

      const onStream = () => {
        const audioEls = Array.from(document.querySelectorAll("audio"));
        let count = 0;

        if (liveCallAgentRef.current) {
          liveCallAgentRef.current.getPeers().forEach((p) => {
            if (LiveCallAgent.isLiveCallDasloop(p.name)) {
              if (videoRef.current) {
                videoRef.current.srcObject = p.stream;
              }
            } else {
              audioEls[count].srcObject = p.stream;
              count++;
            }
          });
        }
      };

      const updatePeers = (peers: ClientPeer[]) => {
        const newPeers = [...peers];
        setClientPeers(newPeers.filter((p) => p.name !== "recording-bot"));
      };

      liveCallAgentRef.current = new LiveCallAgent(
        {
          userName: user.id,
          roomName: dasId,
          host: LIVE_CALL_HOST,
          stream: localStreamRef.current,
          token: credentials.token,
          projectId: project.id,
          onStream,
          updatePeers,
        },
        {
          secure: true,
          config: {
            iceServers: credentials.iceServers,
          },
        }
      );
    }
  };

  const refreshLiveCall = () => {
    if (projects.length > 0 && projects[selectedProjectIndex ?? -1]) {
      setliveCallListIsLoading(true);
      if (accessToken) {
        setliveCallListIsLoading(true);
        const project = projects[selectedProjectIndex as number];
        getProjectLiveCalls({
          accessToken,
          projectId: project.id,
        })
          .then((liveCalls) => {
            setLiveCallList(liveCalls);
            setliveCallListIsLoading(false);
          })
          .catch((error) => {
            if (error instanceof Error) {
              console.error(error);
            }
          });
      }
    }
  };

  const disconnectLiveCall = () => {
    liveCallAgentRef.current?.disconnect();
    localStreamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    setClientPeers([]);
  };

  return (
    <>
      <h1>DasIoT Live Call Example</h1>
      <main>
        <p>Version: {__APP_VERSION__}</p>
        <h2>2 packages is requirement.</h2>
        <code>
          <ol>
            <li>peerjs</li>
            <li>socket.io-client</li>
          </ol>
        </code>

        <form className="auth-container" onSubmit={handleOnSubmit}>
          {!accessToken && (
            <div>
              <div>
                <label htmlFor="userName">Email:</label>
                <input
                  id="userName"
                  value={username}
                  onChange={(e) => setUsername(e.currentTarget.value)}
                />
              </div>
              <div>
                <label htmlFor="password">Password:</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.currentTarget.value)}
                />
              </div>
            </div>
          )}
          <button type="submit">{accessToken ? "Logout" : "Login"}</button>
        </form>
        {projectItems.length > 0 && (
          <>
            <div className="project-list-container">
              <h2>1. Get Project List</h2>
              <h3>Projects</h3>
              <ul>{projectItems}</ul>
            </div>
            <div className="project-list-container">
              <h2>2. Select Project</h2>
              <h3>
                Selected Project={projects[selectedProjectIndex ?? -1]?.name}
              </h3>
              <p>Project ID={projects[selectedProjectIndex ?? -1]?.id}</p>
            </div>
          </>
        )}
        {liveCallListIsLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            {liveCallListItems.length > 0 && (
              <div className="project-list-container">
                <h2>3. Get Live Call DasLoops List</h2>
                <p>
                  Live Call DasLoop Das ID start with{" "}
                  <span className="color-red">{'"L*V"'}</span>{" "}
                  <button onClick={refreshLiveCall}>Refresh Live Call</button>
                </p>
                <h3>Live Call DasLoops</h3>
                <ul>{liveCallListItems}</ul>
              </div>
            )}
          </>
        )}
        <div className="video-container">
          <video ref={videoRef} autoPlay></video>
          <audio hidden autoPlay />
          <audio hidden autoPlay />
          <audio hidden autoPlay />
          <div>
            <button onClick={disconnectLiveCall}>Disconnect</button>
          </div>
        </div>
        <div className="participant-list-container">
          <h3>Participants</h3>
          <ul>
            {clientPeers.map((p) => {
              return <li key={`${p.name}`}>{p.name}</li>;
            })}
          </ul>
        </div>
      </main>
    </>
  );
}

export default App;
