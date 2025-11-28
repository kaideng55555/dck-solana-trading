import { useState } from "react";
import axios from "axios";

const API = "http://localhost:3001";

export default function App() {
  const [token, setToken] = useState("");
  const [authed, setAuthed] = useState(false);
  const [fees, setFees] = useState<any>(null);
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletInput, setWalletInput] = useState("");

  async function loadFees() {
    const res = await axios.get(`${API}/admin/fees`, {
      headers: { "x-admin-token": token }
    });
    setFees(res.data.fees);
  }

  async function loadWallets() {
    const res = await axios.get(`${API}/admin/wallets`, {
      headers: { "x-admin-token": token }
    });
    setWallets(res.data.wallets ?? []);
  }

  async function addWallet() {
    await axios.post(`${API}/admin/wallets/add`, {
      wallet: walletInput
    }, { headers: { "x-admin-token": token } });

    setWalletInput("");
    loadWallets();
  }

  async function authenticate() {
    try {
      await loadFees();
      await loadWallets();
      setAuthed(true);
    } catch {
      alert("Invalid admin token");
    }
  }

  if (!authed) {
    return (
      <div className="p-10 max-w-md mx-auto mt-20">
        <h1 className="text-3xl font-bold mb-4">Admin Login</h1>
        <input
          className="border p-2 w-full"
          placeholder="Admin Token"
          value={token}
          onChange={e => setToken(e.target.value)}
        />
        <button
          className="bg-black text-white px-3 py-2 mt-3 w-full"
          onClick={authenticate}
        >
          Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">DCK$ Tools Admin</h1>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Fee Configuration</h2>
        <pre className="bg-gray-100 p-4 mt-2">{JSON.stringify(fees, null, 2)}</pre>
      </div>

      <div className="mt-10">
        <h2 className="text-xl font-semibold">Wallets</h2>
        
        <div className="flex gap-2 mt-2">
          <input
            className="border p-2 flex-1"
            placeholder="New wallet address"
            value={walletInput}
            onChange={e => setWalletInput(e.target.value)}
          />
          <button
            className="bg-black text-white px-4"
            onClick={addWallet}
          >
            Add
          </button>
        </div>

        <pre className="bg-gray-100 p-4 mt-4">{JSON.stringify(wallets, null, 2)}</pre>
      </div>

    </div>
  );
}
