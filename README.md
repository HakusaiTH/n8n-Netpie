# n8n-NETPIE

**Community node for [n8n](https://n8n.io/)** to read from and publish to **[NETPIE](https://netpie.io/)**.

* 2 nodes included: **NETPIE Read** (Shadow → Get) and **NETPIE Send** (Message → Publish)
* Uses header auth: `Authorization: Device <clientId>:<token>`
* Follows n8n UX guidelines (Resource + Operation, clean copy, Title Case)
* Includes **Simplify** output and **Options → Timeout**

<p align="center">
  <img  src="https://github.com/user-attachments/assets/f01b2b43-9d9a-4305-8786-4c0bb8ae638a"  width="800" alt="Example n8n workflow using NETPIE Read and NETPIE Send" />
</p>

---

## 📦 Installation

### A) Install via Community Nodes (recommended)

1. In n8n go to **Settings → Community Nodes**
2. Click **Install**, search for your package name (e.g. `n8n-nodes-netpie`)
3. Restart n8n if prompted

### B) Install from npm into the custom folder

```bash
mkdir -p ~/.n8n/custom
cd ~/.n8n/custom
npm init -y
npm i n8n-nodes-netpie
n8n start
```

> Requires n8n v1+ and Node.js 18+ (Node 20+ recommended).

---

## 🔐 Credentials (NETPIE API)

Create a new credential: **NETPIE API**

| Field     | Description                                        |
| --------- | -------------------------------------------------- |
| Client ID | Device client ID from NETPIE                       |
| Token     | Device token (stored securely as a password field) |

The node automatically sends:

```
Authorization: Device <clientId>:<token>
Accept: application/json
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/a546ad47-5633-4cb8-a7aa-948a9dcb988f"  width="800" alt="NETPIE credential tested successfully" />
</p>

---

## 🧩 Nodes

### 1) NETPIE Read

Reads a **device shadow value** by alias.

* **Resource:** `Shadow`
* **Operation:** `Get`

**Parameters**

| Name              | Type    | Required | Example | Description                       |
| ----------------- | ------- | -------- | ------- | --------------------------------- |
| Alias             | String  | ✅        | `led`   | Shadow alias to retrieve          |
| Simplify          | Boolean | –        | `true`  | Return compact `{ alias, value }` |
| Options → Timeout | Number  | –        | `15000` | Request timeout in milliseconds   |

**Output (Simplify = On)**

```json
{
  "alias": "led",
  "value": {
    "deviceid": "10e2968a-...",
    "data": { "Temperature": 25.62, "Timestamp": "00:10:37" },
    "rev": 1466,
    "timestamp": 1760932094846,
    "modified": 1760932094849
  }
}
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/004d49ec-e76b-4d62-8b69-27b6191d482c" width="800" alt="NETPIE Read node output" />
</p>

---

### 2) NETPIE Send

Publishes a message to a topic.

* **Resource:** `Message`
* **Operation:** `Publish`

**Parameters**

| Name                   | Type    | Required | Example                           | Description                           |
| ---------------------- | ------- | -------- | --------------------------------- | ------------------------------------- |
| Topic                  | String  | ✅        | `led`                             | Topic to publish to                   |
| Payload                | String  | ✅        | `ledon`                           | Message payload (JSON string allowed) |
| Simplify               | Boolean | –        | `true`                            | Return `{ published, topic, result }` |
| Options → Content Type | Options | –        | `text/plain` | `application/json` | Payload content type                  |
| Options → Timeout      | Number  | –        | `15000`                           | Request timeout in milliseconds       |

**Output (Simplify = On)**

```json
{ "published": true, "topic": "led", "result": "ok" }
```

<p align="center">
  <img src="https://github.com/user-attachments/assets/e1493d0f-537b-4bd1-9e3c-c103fdae4501" width="800" alt="NETPIE Send node output" />
</p>

---

## 🚀 Example Workflow

1. **NETPIE Read** — Shadow:Get (`alias=led`)
2. **NETPIE Send** — Message:Publish (`topic=led`, `payload=ledon`)

Click **Execute workflow** and inspect the node outputs.

---

## 🛠 Local Development

```bash
# Build the package
npm run build

# Link locally
npm link
cd ~/.n8n/custom
npm init -y
npm link n8n-nodes-netpie
n8n start
```

Ensure your `package.json` includes:

```json
{
  "files": ["dist", "README.md", "LICENSE"],
  "n8n": {
    "nodes": [
      "dist/nodes/NetpieRead/NetpieRead.node.js",
      "dist/nodes/NetpieSend/NetpieSend.node.js"
    ],
    "credentials": ["dist/credentials/NetpieApi.credentials.js"]
  }
}
```

---

## 📑 API Reference (quick)

* Base: `https://api.netpie.io/v2/device`
* Read shadow: `GET /shadow/data?alias=<alias>`
* Publish message: `PUT /message?topic=<topic>`

  * Header: `Content-Type: text/plain` or `application/json`
  * Body: payload (valid JSON if `application/json`)

---

## 🔍 Troubleshooting

* **401/403 Unauthorized**
  Verify `Client ID` and `Token` belong to the correct device and are active.

* **404 alias not found**
  Make sure the device shadow actually contains the alias you are querying.

* **Invalid JSON payload**
  When `Content Type = application/json`, the `Payload` must be valid JSON (e.g. `{"cmd":"ledon"}`).

* **Timeouts**
  Increase **Options → Timeout** and confirm the NETPIE service is reachable from your n8n host.

---

## 🧑‍💻 Maintainer

Developed by **Phoovadet Noobdev**

---

## 📝 License

[MIT License](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
