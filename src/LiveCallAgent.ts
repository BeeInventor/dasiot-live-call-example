import { LogLevel, MediaConnection, Peer } from "peerjs";
import { io, Socket } from "socket.io-client";

function sdpTransform(sdp: string) {
  sdp = sdp.replace(
    [
      "a=rtpmap:96 VP8/90000",
      "a=rtcp-fb:96 goog-remb",
      "a=rtcp-fb:96 transport-cc",
      "a=rtcp-fb:96 ccm fir",
      "a=rtcp-fb:96 nack",
      "a=rtcp-fb:96 nack pli",
      "a=rtpmap:97 rtx/90000",
      "a=fmtp:97 apt=96",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:35 AV1/90000",
      "a=rtcp-fb:35 goog-remb",
      "a=rtcp-fb:35 transport-cc",
      "a=rtcp-fb:35 ccm fir",
      "a=rtcp-fb:35 nack",
      "a=rtcp-fb:35 nack pli",
      "a=rtpmap:36 rtx/90000",
      "a=fmtp:36 apt=35",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:45 AV1/90000",
      "a=rtcp-fb:45 goog-remb",
      "a=rtcp-fb:45 transport-cc",
      "a=rtcp-fb:45 ccm fir",
      "a=rtcp-fb:45 nack",
      "a=rtcp-fb:45 nack pli",
      "a=rtpmap:46 rtx/90000",
      "a=fmtp:46 apt=45",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:100 VP9/90000",
      "a=rtcp-fb:100 goog-remb",
      "a=rtcp-fb:100 transport-cc",
      "a=rtcp-fb:100 ccm fir",
      "a=rtcp-fb:100 nack",
      "a=rtcp-fb:100 nack pli",
      "a=fmtp:100 profile-id=2",
      "a=rtpmap:101 rtx/90000",
      "a=fmtp:101 apt=100",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:98 VP9/90000",
      "a=rtcp-fb:98 goog-remb",
      "a=rtcp-fb:98 transport-cc",
      "a=rtcp-fb:98 ccm fir",
      "a=rtcp-fb:98 nack",
      "a=rtcp-fb:98 nack pli",
      "a=fmtp:98 profile-id=0",
      "a=rtpmap:99 rtx/90000",
      "a=fmtp:99 apt=98",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace("a=fmtp:100 ", "a=fmtp:100 max-fps=10;");
  sdp = sdp.replace(
    ["a=extmap:13 urn:3gpp:video-orientation", ""].join("\r\n"),
    ""
  );

  return sdp;
}
function sdpTransformForVp8(sdp: string) {
  sdp = sdp.replace(
    ["a=rtpmap:96 VP8/90000"].join("\r\n"),
    ["a=rtpmap:96 VP8/90000", "a=fmtp:96 max-fr=10;max-fs=1200"].join("\r\n")
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:35 AV1/90000",
      "a=rtcp-fb:35 goog-remb",
      "a=rtcp-fb:35 transport-cc",
      "a=rtcp-fb:35 ccm fir",
      "a=rtcp-fb:35 nack",
      "a=rtcp-fb:35 nack pli",
      "a=rtpmap:36 rtx/90000",
      "a=fmtp:36 apt=35",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:45 AV1/90000",
      "a=rtcp-fb:45 goog-remb",
      "a=rtcp-fb:45 transport-cc",
      "a=rtcp-fb:45 ccm fir",
      "a=rtcp-fb:45 nack",
      "a=rtcp-fb:45 nack pli",
      "a=rtpmap:46 rtx/90000",
      "a=fmtp:46 apt=45",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:100 VP9/90000",
      "a=rtcp-fb:100 goog-remb",
      "a=rtcp-fb:100 transport-cc",
      "a=rtcp-fb:100 ccm fir",
      "a=rtcp-fb:100 nack",
      "a=rtcp-fb:100 nack pli",
      "a=fmtp:100 profile-id=2",
      "a=rtpmap:101 rtx/90000",
      "a=fmtp:101 apt=100",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace(
    [
      "a=rtpmap:98 VP9/90000",
      "a=rtcp-fb:98 goog-remb",
      "a=rtcp-fb:98 transport-cc",
      "a=rtcp-fb:98 ccm fir",
      "a=rtcp-fb:98 nack",
      "a=rtcp-fb:98 nack pli",
      "a=fmtp:98 profile-id=0",
      "a=rtpmap:99 rtx/90000",
      "a=fmtp:99 apt=98",
      "",
    ].join("\r\n"),
    ""
  );
  sdp = sdp.replace("a=fmtp:100 ", "a=fmtp:100 max-fps=10;");
  sdp = sdp.replace(
    ["a=extmap:13 urn:3gpp:video-orientation", ""].join("\r\n"),
    ""
  );

  return sdp;
}
export function getSdpTransformer(codec: "h264" | "vp8") {
  switch (codec) {
    case "h264":
      return sdpTransform;
    case "vp8":
      return sdpTransformForVp8;
    default:
      throw new Error("Unsupported codec");
  }
}

interface LiveCallAgentData {
  host: string;
  roomName: string;
  userName: string;
  stream: MediaStream;
  token: string;
  projectId?: string;
  onStream?: (name: string) => void;
  updatePeers?: (peers: ClientPeer[]) => void;
}

interface LiveCallAgentOptions {
  secure?: boolean;
  config?: {
    iceServers?: Array<{
      urls: string;
      username: string;
      credential: string;
    }>;
  };
  debug?: LogLevel;
}

export interface ClientPeer {
  peer: MediaConnection;
  name: string;
  stream: MediaStream;
}

class LiveCallAgent {
  private peer: Peer;

  private ws: Socket;

  private sdpTransform: (sdp: string) => string;

  private stream: MediaStream;

  private peers: ClientPeer[];

  private userName: string;

  private onStream?: (name: string) => void;

  private updatePeers?: (peers: ClientPeer[]) => void;

  constructor(data: LiveCallAgentData, options: LiveCallAgentOptions) {
    this.userName = data.userName;
    this.peer = new Peer({
      host: data.host,
      secure: options.secure,
      path: "/peer",
      config: options.config,
      token: data.token,
      debug: options.debug,
    });
    this.ws = io(`${options.secure ? "https" : "http"}://${data.host}`, {
      host: data.host,
      path: "/ws",
      secure: options.secure,
      auth: {
        token: data.token,
      },
    });
    this.stream = data.stream;
    this.peers = [];
    this.sdpTransform = getSdpTransformer("vp8");
    this.onStream = data.onStream;
    this.updatePeers = data.updatePeers;

    this.ws.on(
      `room:${data.roomName}:join`,
      ({ peerId: id, name }: { peerId: string; name: string }) => {
        // console.log(`${name} join to room (${id})`);

        if (name !== data.userName) {
          this.callPeer(id, name, data.projectId);
        }
      }
    );

    this.ws.on(
      `room:${data.roomName}:leave`,
      ({ peerId: id }: { peerId: string }) => {
        // console.log(`${id} leave to room`);
        this.hangUpPeer(id);
      }
    );

    this.peer.on("open", (id) => {
      this.ws.emit("join", {
        room: data.roomName,
        name: data.userName,
        peerId: id,
        projectId: data.projectId,
      });
    });

    this.peer.on("call", (call) => {
      // console.log(`received from ${call.metadata.from}`);

      call.answer(this.stream, {
        sdpTransform: this.sdpTransform,
      });

      call.on("stream", (remoteStream) => {
        this.handleOnStream(
          call,
          remoteStream,
          (call.metadata as { from: string }).from
        );
      });
    });

    this.peer.on("error", (err) => {
      console.error(err);
    });
  }

  static isLiveCallDasloop(dasId: string) {
    return /^L.V.*/.test(dasId);
  }

  private handleOnStream(
    mediaConnection: MediaConnection,
    stream: MediaStream,
    name: string
  ) {
    let isExist = false;

    for (let i = 0; i < this.peers.length; i++) {
      if (this.peers[i].name === name) {
        isExist = true;
        break;
      }
    }

    if (!isExist) {
      this.peers.push({
        peer: mediaConnection,
        name,
        stream,
      });

      this.onStream?.(name);
    }
    this.updatePeers?.(this.peers);
  }

  private callPeer(id: string, name: string, projectId?: string) {
    if (!this.peer) {
      console.error("Peer not ready");
      return;
    }

    const call = this.peer.call(id, this.stream, {
      metadata: { from: this.userName, to: name, projectId },
      sdpTransform: this.sdpTransform,
    });

    if (!call) {
      console.error(`call failed for ${id} from ${this.peer.id}`);
      return;
    }

    // console.log(`call to ${name}`);

    call.on("stream", (remoteStream) => {
      this.handleOnStream(
        call,
        remoteStream,
        (call.metadata as { to: string }).to
      );
    });
  }

  private hangUpPeer(id: string) {
    this.peers = this.peers.filter((p) => {
      if (p.peer.peer === id) {
        // console.log(`hang up ${p.name} (${id})`);
        p.peer.close();
      }
      return p.peer.peer !== id;
    });
    this.updatePeers?.(this.peers);
  }

  connect() {
    this.peer.reconnect();
    this.ws.connect();
  }

  disconnect(cb?: () => void) {
    this.peer.disconnect();
    this.ws.disconnect();
    this.peers.forEach((p) => {
      p.peer.close();
    });
    this.peers = [];
    cb?.();
  }

  disconnected(cb: (v: boolean) => void) {
    if (this.peer.disconnected && this.ws) {
      cb(false);
    }
  }

  getPeers() {
    return this.peers;
  }

  async getPeersStats() {
    let getPeersStatsPromise: Promise<{
      name: string;
      stats: RTCStatsReport;
    }>[] = [];

    getPeersStatsPromise = this.peers.map((p) => {
      return p.peer.peerConnection
        .getStats()
        .then((stats) => ({ name: p.name, stats }));
    });

    return Promise.all(getPeersStatsPromise);
  }
}

export default LiveCallAgent;

const createBlankVideoStream = (opts = { width: 192, height: 108 }) => {
  const canvas = Object.assign(document.createElement("canvas"), {
    width: opts?.width ?? 192,
    height: opts?.height ?? 108,
  });

  canvas.id = "blank-canvas";

  canvas.getContext("2d")?.fillRect(0, 0, opts.width, opts.height);

  const stream = canvas.captureStream();

  return stream;
};

export const getLocalStream = async (
  { audio, video } = { audio: true, video: false }
) => {
  // For now, we can't send blank video from user media
  // https://github.com/peers/peerjs/issues/944
  const userStream = await navigator.mediaDevices.getUserMedia({
    audio,
    video,
  });

  if (!video) {
    userStream.addTrack(createBlankVideoStream().getVideoTracks()[0]);
  }
  return userStream;
};
