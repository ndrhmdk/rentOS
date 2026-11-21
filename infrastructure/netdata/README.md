# Netdata on the rentOS VPS

This guide installs Netdata on the VPS **host** to monitor host CPU, memory, disk, and network. Laravel remains responsible for application failures and slow SQL. Netdata should keep running even if Docker or the API container has a problem, so do not add it as a service in `compose.production.yml`.

The linked [Netdata VPS installation guide](https://thuevpsgiare.vn/cach-cai-netdata-tren-vps/) covers installation, dashboard access, and notifications. This guide adapts those steps to rentOS: the dashboard binds only to localhost, and you reach it through an SSH tunnel. Do not expose port `19999` publicly.

## 1. Connect to the VPS

From your computer, open a terminal and connect using the SSH username and private key configured for your VPS:

```sh
ssh -i ~/path/to/private-key <vps-user>@<vps-public-ip>
```

Do not share or upload the private key. If SSH reports `Permission denied (publickey)`, check the username and key in your VPS provider's console. The `root` account may not permit SSH login; use the configured administrator account instead.

Run the following installation and configuration commands in this SSH session unless the step says to use your computer.

## 2. Install the Netdata Agent on the host

For Ubuntu or Debian, update package metadata and install `curl` if needed:

```sh
sudo apt update
sudo apt install -y curl
```

Run Netdata's official kickstart installer and choose the stable release if prompted:

```sh
bash <(curl -Ss https://get.netdata.cloud/kickstart.sh)
```

The installer may ask whether to connect the node to Netdata Cloud. Cloud connection is optional; see [Netdata Cloud or local-only](#netdata-cloud-or-local-only) below. Verify the service:

```sh
sudo systemctl status netdata
```

The linked article also describes APT and Docker installation. For rentOS, use the host Agent installation above. A Docker-only Agent can stop with its container and is not the intended host monitoring setup.

## 3. Configure resource use and private dashboard access

Edit the installed Agent's configuration with Netdata's helper:

```sh
sudo /etc/netdata/edit-config netdata.conf
```

Add or update these settings. If a section already exists, edit that section rather than creating a duplicate:

```ini
[global]
    bind to = 127.0.0.1

[ml]
    enabled = no

[db]
    mode = dbengine
    storage tiers = 1
    dbengine tier 0 retention size = 256MiB
    dbengine tier 0 retention time = 1d

[health]
    enabled = yes
```

Binding to `127.0.0.1` means the dashboard is not directly reachable through the VPS public IP. Do not open or forward port `19999` in UFW, your cloud firewall, or Dokploy. Restart Netdata after changing the config:

```sh
sudo systemctl restart netdata
```

Check the listen address on the VPS:

```sh
sudo ss -lntp | grep ':19999'
```

The expected address is `127.0.0.1:19999`. If it shows `0.0.0.0:19999`, `[::]:19999`, or the VPS public IP, review the config before continuing.

## 4. Open the dashboard with an SSH tunnel

On your **computer**, in a second terminal, run:

```sh
ssh -i ~/path/to/private-key -L 19999:127.0.0.1:19999 <vps-user>@<vps-public-ip>
```

Keep this SSH process running. Visit this address in your computer's browser:

```text
http://localhost:19999
```

The SSH connection uses the VPS public IP, while the dashboard traffic is forwarded through the tunnel. You do not need a public dashboard port or a public IP in the browser URL. To check public reachability from your computer, run `nc -vz -w 3 <vps-public-ip> 19999`; it should fail when the dashboard is private. Network firewalls can also affect that test.

## 5. Configure alert delivery

The example file is [`health_alarm_notify.conf.example`](health_alarm_notify.conf.example). Create/edit the live file on the VPS:

```sh
sudo /etc/netdata/edit-config health_alarm_notify.conf
```

Configure the notification method and recipient you want Netdata to use. The checked-in example contains placeholders; replace them on the VPS with real values. Keep webhook URLs, SMTP credentials, and other secrets out of Git. Netdata notifications are independent from Laravel's email and Discord alert delivery.

## 6. Install rentOS host alarms

You do not need to clone the application repository onto the VPS. From your **computer**, in the repository root, copy the alarm file:

```sh
scp -i ~/path/to/private-key infrastructure/netdata/health.d/rentos.conf \
  <vps-user>@<vps-public-ip>:/tmp/rentos.conf
```

Then, in the VPS SSH session, install the file and reload health rules:

```sh
sudo install -D -m 644 /tmp/rentos.conf /etc/netdata/health.d/rentos.conf
sudo netdatacli reload-health
rm /tmp/rentos.conf
```

The source file in this repository is [`health.d/rentos.conf`](health.d/rentos.conf). If your Netdata installation uses a nonstandard config directory, inspect the Agent's `[directories]` section in `netdata.conf` and place `rentos.conf` in that Agent's configured health directory.

The starting thresholds in the repo are:

| Alarm | Chart | Evaluation window | Warning | Critical |
| --- | --- | --- | ---: | ---: |
| `rentos_cpu_usage` | `system.cpu` | 5-minute average | > 85% | > 95% |
| `rentos_ram_usage` | `system.ram` | 5-minute average | > 85% | > 95% |
| `rentos_disk_space` | `disk_space./` | 5-minute average | > 85% | > 95% |

Confirm that the chart names and dimensions exist on the installed Agent before relying on these rules. In particular, disk chart names can vary. An alert showing `rentos_ram_usage` as critical at 56.1%, for example, does not match the checked-in `> 95%` critical threshold; inspect the active rule/config and dashboard for stale or different settings.

After editing an alarm, reload it with:

```sh
sudo netdatacli reload-health
```

Silence stock CPU/RAM alarms only after confirming they overlap with rentOS alarms, so duplicate notifications do not obscure which rule fired. Use Netdata's `edit-config` helper on the relevant stock alarm files; do not modify files under the Agent's stock configuration directory because updates may replace them.

## Netdata Cloud or local-only

Netdata Cloud is optional. If you connect/claim the Agent to Cloud, the Agent communicates with Netdata's remote service so you can see the node in your Cloud Space. The agent's local configuration files remain on the VPS. This is separate from the local dashboard and from `registry.my-netdata.io`, which provides browser-to-agent registry/alert redirection.

For a local-only setup, do not claim the Agent during installation. Use the SSH tunnel in step 4. An alert redirect may say it cannot find an Agent until the same browser has first visited that Agent's dashboard; with this private setup, open `http://localhost:19999` while the tunnel is active, then try the alert again. The Registry is not required for CPU/memory/disk collection or notification delivery.

## Test and troubleshoot alerts

1. Open the dashboard through the SSH tunnel and confirm CPU, memory, disk, and network charts are populating.
2. Check the active health alarm and its actual chart/dimension and threshold.
3. For a controlled demo, temporarily lower one warning threshold in the VPS copy of `rentos.conf`, then run `sudo netdatacli reload-health`.
4. Confirm the alarm appears and the configured notification arrives.
5. Restore the threshold and reload health again. Do not leave a test threshold in production.

If a notification marks a low value as critical, first compare the notification's alarm name with the active rule shown by the Agent; do not assume the checked-in example is the config currently loaded on the VPS. For notification troubleshooting, inspect the Agent service log with `sudo journalctl -u netdata -n 100 --no-pager`.

## Scope and security notes

- Netdata measures the VPS host. It does not measure Supabase database disk or storage bucket usage.
- Dokploy container graphs are optional context, not a substitute for host monitoring.
- Keep port `19999` private. Prefer an SSH tunnel for dashboard access; if remote browser access is required, use an authenticated TLS reverse proxy and restrict access.
- Keep notification secrets on the VPS, never in the repository.
- Do not run Netdata as an application Compose service for this setup.

## References

- [Cách cài Netdata trên VPS (Vietnamese)](https://thuevpsgiare.vn/cach-cai-netdata-tren-vps/)
- [Official Netdata Linux installation](https://learn.netdata.cloud/docs/netdata-agent/installation/linux/)
- [Official Netdata Registry configuration](https://learn.netdata.cloud/docs/netdata-agent/configuration/registry)
