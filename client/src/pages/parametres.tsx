import React, { useState, useEffect } from "react";

function showToast(message: string, type: 'success' | 'error' = 'success') {
  // Simple toast (remplace par ta lib de toast si besoin)
  const toast = document.createElement('div');
  toast.textContent = message;
  toast.className = `fixed top-4 right-4 z-50 px-4 py-2 rounded shadow text-white ${type === 'success' ? 'bg-green-600' : 'bg-red-600'}`;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 2500);
}

export default function Parametres() {
  // Profil
  const [nom, setNom] = useState("Dr. florence deha");
  const [email, setEmail] = useState("florence.deha@email.com");
  const [password, setPassword] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Thème
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || "light");
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Langue
  const [langue, setLangue] = useState("fr");

  // Notifications
  const [notifEmail, setNotifEmail] = useState(true);

  // Sécurité
  const handleLogoutAll = () => {
    showToast("Déconnexion de tous les appareils effectuée.");
  };
  const handle2FA = () => {
    showToast("Double authentification activée (simulation)");
  };

  // Sauvegarde profil
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setEditMode(false);
    showToast("Profil mis à jour !");
  };

  // Notifications
  const handleNotifChange = (checked: boolean) => {
    setNotifEmail(checked);
    showToast(checked ? "Notifications email activées" : "Notifications email désactivées");
  };

  return (
    <div className="p-8 space-y-8 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Paramètres</h1>

      {/* Profil utilisateur */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Profil utilisateur</h2>
        {editMode ? (
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input type="text" className="w-full border rounded px-3 py-2" value={nom} onChange={e => setNom(e.target.value)} required />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full border rounded px-3 py-2" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nouveau mot de passe</label>
              <input type="password" className="w-full border rounded px-3 py-2" value={password} onChange={e => setPassword(e.target.value)} placeholder="Laisser vide pour ne pas changer" />
            </div>
            <div className="flex gap-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
              <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={() => setEditMode(false)}>Annuler</button>
            </div>
          </form>
        ) : (
          <>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Nom</label>
                <input type="text" className="w-full border rounded px-3 py-2 bg-gray-100" value={nom} disabled />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Email</label>
                <input type="email" className="w-full border rounded px-3 py-2 bg-gray-100" value={email} disabled />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Mot de passe</label>
              <input type="password" className="w-full border rounded px-3 py-2 bg-gray-100" value="********" disabled />
            </div>
            <button className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setEditMode(true)}>Modifier le profil</button>
          </>
        )}
      </div>

      {/* Préférences d'affichage */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Préférences d'affichage</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Thème</label>
            <select className="w-full border rounded px-3 py-2" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Clair</option>
              <option value="dark">Sombre</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Langue</label>
            <select className="w-full border rounded px-3 py-2" value={langue} onChange={e => setLangue(e.target.value)}>
              <option value="fr">Français</option>
              <option value="en">Anglais</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Notifications</h2>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={notifEmail} onChange={e => handleNotifChange(e.target.checked)} />
          Recevoir les notifications par email
        </label>
      </div>

      {/* Sécurité */}
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <h2 className="text-lg font-semibold mb-2">Sécurité</h2>
        <button className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleLogoutAll}>Déconnexion de tous les appareils</button>
        <button className="ml-4 px-4 py-2 bg-gray-200 text-gray-700 rounded" onClick={handle2FA}>Activer la double authentification</button>
      </div>

      {/* À propos */}
      <div className="bg-white rounded-lg shadow p-6 space-y-2">
        <h2 className="text-lg font-semibold mb-2">À propos</h2>
        <p className="text-sm text-gray-600">Version de l'application : <b>1.0.0</b></p>
        <a href="#" className="text-blue-600 hover:underline text-sm">Contacter le support</a>
      </div>
    </div>
  );
} 