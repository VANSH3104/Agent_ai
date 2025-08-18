// components/WebhookConfigForm.tsx
import { useState } from "react";

export function WebhookConfigForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [form, setForm] = useState({
    name: "",
    method: "POST",
    path: "/api/agents/webhook",
    authType: "none",
    authSecret: "",
    allowedEvents: "",
    payloadMapping: "",
    corsOrigins: "*",
    ipWhitelist: "",
    binary: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedData = {
      ...form,
      allowedEvents: form.allowedEvents.split(",").map(ev => ev.trim()).filter(Boolean),
      payloadMapping: form.payloadMapping ? JSON.parse(form.payloadMapping) : {},
      ipWhitelist: form.ipWhitelist.split(",").map(ip => ip.trim()).filter(Boolean)
    };
    onSubmit(formattedData);
  };

  return (
    <form className="max-w-xl mx-auto p-4 bg-white rounded shadow" onSubmit={handleSubmit}>
      <h2 className="text-xl font-bold mb-4">Webhook Setup</h2>

      {/* Name */}
      <label className="block mb-2">Webhook Name</label>
      <input name="name" value={form.name} onChange={handleChange} className="border p-2 w-full mb-4" />

      {/* Method */}
      {/* <label className="block mb-2">HTTP Method</label>
      <select name="method" value={form.method} onChange={handleChange} className="border p-2 w-full mb-4">
        <option>POST</option>
        <option>GET</option>
        <option>PUT</option>
        <option>PATCH</option>
        <option>DELETE</option>
      </select> */}

      {/* Path */}
      <label className="block mb-2">Webhook Path</label>
      <input name="path" value={form.path} className="border p-2 w-full mb-4" readOnly />

      {/* Auth Type */}
      <label className="block mb-2">Authentication Type</label>
      <select name="authType" value={form.authType} onChange={handleChange} className="border p-2 w-full mb-4">
        <option value="none">None</option>
        <option value="basic">Basic Auth</option>
        <option value="header">Header Token</option>
        <option value="jwt">JWT</option>
      </select>

      {/* Auth Secret */}
      {form.authType !== "none" && (
        <>
          <label className="block mb-2">Authentication Secret</label>
          <input name="authSecret" value={form.authSecret} onChange={handleChange} className="border p-2 w-full mb-4" />
        </>
      )}

      {/* Allowed Events */}
      <label className="block mb-2">Allowed Events (comma-separated)</label>
      <input name="allowedEvents" value={form.allowedEvents} onChange={handleChange} className="border p-2 w-full mb-4" />
      

      {/* Payload Mapping */}
      <label className="block mb-2">Payload Mapping (JSON)</label>
      <textarea
        name="payloadMapping"
        value={form.payloadMapping}
        onChange={handleChange}
        placeholder='{"repo": "repository.name", "message": "head_commit.message"}'
        className="border p-2 w-full mb-4"
      />

      {/* CORS */}
      <label className="block mb-2">Allowed Origins (CORS)</label>
      <input name="corsOrigins" value={form.corsOrigins} onChange={handleChange} className="border p-2 w-full mb-4" />

      {/* IP Whitelist */}
      <label className="block mb-2">IP Whitelist (comma-separated)</label>
      <input name="ipWhitelist" value={form.ipWhitelist} onChange={handleChange} className="border p-2 w-full mb-4" />

      {/* Binary */}
      <label className="block mb-2">
        <input type="checkbox" name="binary" checked={form.binary} onChange={handleChange} className="mr-2" />
        Receive Binary Data
      </label>

      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded mt-4">
        Save Webhook
      </button>
    </form>
  );
}
