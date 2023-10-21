import $ from "https://deno.land/x/dax@0.35.0/mod.ts";
import type * as sunbeam from "npm:sunbeam-types@0.22.16";

if (Deno.args.length == 0) {
  const manifest: sunbeam.Manifest = {
    title: "Tailcale",
    commands: [
      {
        name: "list-devices",
        title: "Search My Devices",
        mode: "view",
      },
      {
        name: "ssh",
        title: "SSH to a device",
        mode: "tty",
        params: [
          {
            name: "device",
            type: "string",
            required: true,
          },
        ],
      },
    ],
  };
  console.log(JSON.stringify(manifest));

  Deno.exit(0);
}

if (Deno.args[0] == "list-devices") {
  const status = await $`tailscale status --json`.json();
  const devices = Object.values(status.Peer) as any[];
  const items: sunbeam.ListItem[] = devices.map((device) => ({
    title: device.DNSName.split(".")[0],
    subtitle: device.TailscaleIPs[0],
    accessories: [device.OS, device.Online ? "online" : "offline"],
    actions: [
      {
        title: "SSH to Device",
        onAction: {
          type: "run",
          command: "ssh",
          params: {
            device: device.DNSName.split(".")[0],
          },
        },
      },
      {
        title: "Copy SSH Command",
        onAction: {
          type: "copy",
          text: `ssh ${device.TailscaleIPs[0]}`,
          exit: true,
        },
      },
      {
        title: "Copy IP",
        onAction: {
          type: "copy",
          text: device.TailscaleIPs[0],
          exit: true,
        },
      },
    ],
  }));

  const list: sunbeam.List = { type: "list", items };

  console.log(JSON.stringify(list));
} else if (Deno.args[0] == "ssh") {
  const { params } = await new Response(Deno.stdin.readable).json();
  await $`sunbeam wrap -- ssh ${params.device}`;
  console.log(JSON.stringify({ type: "exit" } as sunbeam.Command));
}
