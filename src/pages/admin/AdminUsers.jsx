import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminCollection } from '../../hooks/useAdminCollection';

const emptyForm = {
    displayName: '',
    email: '',
    followerCount: 0,
    isVerified: false,
    photoURL: '',
    role: 'user',
    title: '',
};

const normalizeUser = (form) => ({
    ...form,
    followerCount: Number(form.followerCount || 0),
    isVerified: Boolean(form.isVerified),
});

const AdminUsers = () => {
    const { deleteItem, error, items: users, loading, submitting, updateItem } = useAdminCollection('users', 'email');
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const handleChange = (event) => {
        const { checked, name, type, value } = event.target;
        setForm((current) => ({
            ...current,
            [name]: type === 'checkbox' ? checked : value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!editingId) {
            return;
        }

        await updateItem(editingId, normalizeUser(form));
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleEdit = (user) => {
        setEditingId(user.id);
        setForm({
            displayName: user.displayName || user.name || '',
            email: user.email || '',
            followerCount: user.followerCount || 0,
            isVerified: Boolean(user.isVerified),
            photoURL: user.photoURL || '',
            role: user.role || 'user',
            title: user.title || '',
        });
    };

    const handleDelete = async (user) => {
        if (window.confirm(`${user.email || user.displayName || user.id} profil dokumani silinsin mi? Auth hesabi silinmez.`)) {
            await deleteItem(user.id);
        }
    };

    return (
        <section className="space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                <div>
                    <p className="text-sm font-medium text-emerald-700">Admin / Users</p>
                    <h1 className="mt-2 text-2xl font-bold text-slate-950">Kullanici Profil Yonetimi</h1>
                    <p className="mt-2 text-sm text-slate-600">
                        users collection dokumanlari duzenlenir. Auth hesabi olusturma/silme Cloud Functions ile yapilmalidir.
                    </p>
                </div>
                <Link className="text-sm font-medium text-red-700 hover:text-red-900" to="/admin">
                    Admin panele don
                </Link>
            </div>

            <form className="grid gap-4 rounded border bg-white p-5 md:grid-cols-2" onSubmit={handleSubmit}>
                <label className="text-sm font-medium text-slate-700">
                    Ad Soyad
                    <input className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} name="displayName" onChange={handleChange} value={form.displayName} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Email
                    <input className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} name="email" onChange={handleChange} type="email" value={form.email} />
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Rol
                    <select className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} name="role" onChange={handleChange} value={form.role}>
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                    </select>
                </label>
                <label className="text-sm font-medium text-slate-700">
                    Takipci Sayisi
                    <input className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} min="0" name="followerCount" onChange={handleChange} type="number" value={form.followerCount} />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Unvan
                    <input className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} name="title" onChange={handleChange} value={form.title} />
                </label>
                <label className="text-sm font-medium text-slate-700 md:col-span-2">
                    Photo URL
                    <input className="mt-1 w-full rounded border px-3 py-2" disabled={!editingId} name="photoURL" onChange={handleChange} value={form.photoURL} />
                </label>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                    <input checked={form.isVerified} disabled={!editingId} name="isVerified" onChange={handleChange} type="checkbox" />
                    Onayli profil
                </label>
                <div className="flex gap-3 md:col-span-2">
                    <button className="rounded bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60" disabled={!editingId || submitting} type="submit">
                        Guncelle
                    </button>
                    {editingId && (
                        <button className="rounded border px-4 py-2 text-sm" onClick={() => { setEditingId(null); setForm(emptyForm); }} type="button">
                            Vazgec
                        </button>
                    )}
                </div>
            </form>

            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error.message}</p>}
            {loading && <p className="rounded border border-dashed bg-white p-4 text-sm text-slate-500">Kullanicilar yukleniyor...</p>}

            <div className="overflow-hidden rounded border bg-white">
                <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b bg-slate-50 px-4 py-3 text-xs font-semibold uppercase text-slate-500">
                    <span>Kullanici</span>
                    <span>Rol</span>
                    <span>Takipci</span>
                    <span>Islem</span>
                </div>
                {users.map((user) => (
                    <div className="grid grid-cols-[1.4fr_1fr_1fr_auto] gap-3 border-b px-4 py-3 text-sm last:border-b-0" key={user.id}>
                        <div>
                            <p className="font-medium text-slate-950">{user.displayName || user.name || 'Kullanici'}</p>
                            <p className="text-xs text-slate-500">{user.email || user.id}</p>
                        </div>
                        <span className="text-slate-600">{user.role || 'user'}</span>
                        <span className="text-slate-600">{Number(user.followerCount || 0)}</span>
                        <div className="flex gap-2">
                            <button className="rounded border px-3 py-1 text-xs" onClick={() => handleEdit(user)} type="button">Duzenle</button>
                            <button className="rounded border border-red-200 px-3 py-1 text-xs text-red-700" onClick={() => handleDelete(user)} type="button">Sil</button>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
};

export default AdminUsers;