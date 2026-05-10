import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { uploadProfilePhoto } from "../firebase/storage";

const ProfilePage = () => {
    const navigate = useNavigate();
    const {
        currentUser,
        userProfile,
        updateProfileInfo,
        changePassword,
        sendVerificationEmail,
        refreshUserProfile,
        logout,
    } = useAuth();

    const [profileForm, setProfileForm] = useState({
        displayName: userProfile?.displayName || '',
        photoURL: userProfile?.photoURL || '',
    });

    const [passwordForm, setPasswordForm] = useState({
        newPassword: '',
        confirmPassword: '',
    });

    const [selectedPhoto, setSelectedPhoto] = useState(null);
    const [photoPreview, setPhotoPreview] = useState(userProfile?.photoURL || '');
    const [statusMessage, setStatusMessage] = useState('');
    const [error, setError] = useState('');
    const [isProfileSaving, setIsProfileSaving] = useState(false);
    const [isPasswordSaving, setIsPasswordSaving] = useState(false);
    const [isVerificationSending, setIsVerificationSending] = useState(false);
    const [isLoggingOut, setIsLoggingOut] = useState(false);

    useEffect(() => {
        if (userProfile) {
            setProfileForm({
                displayName: userProfile.displayName || '',
                photoURL: userProfile.photoURL || '',
            });
            setPhotoPreview(userProfile.photoURL || '');
        }
    }, [userProfile]);

    const clearMessages = () => {
        setError('');
        setStatusMessage('');
    };

    const handleProfileInputChange = (event) => {
        setProfileForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handlePasswordInputChange = (event) => {
        setPasswordForm((current) => ({
            ...current,
            [event.target.name]: event.target.value,
        }));
    };

    const handlePhotoChange = (event) => {
        const file = event.target.files?.[0];
        setSelectedPhoto(file || null);

        if (file) {
            setPhotoPreview(URL.createObjectURL(file));
        }
    };

    const handleProfileSubmit = async (event) => {
        event.preventDefault();
        clearMessages();
        setIsProfileSaving(true);

        try {
            let photoURL = profileForm.photoURL;

            if (selectedPhoto) {
                photoURL = await uploadProfilePhoto({
                    userId: currentUser.uid,
                    file: selectedPhoto,
                });
            }

            await updateProfileInfo({
                user: currentUser,
                displayName: profileForm.displayName,
                photoURL,
            });

            await refreshUserProfile(currentUser.uid);
            setSelectedPhoto(null);
            setProfileForm((current) => ({ ...current, photoURL }));
            setPhotoPreview(photoURL);
            setStatusMessage('Profil bilgilerin güncellendi.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsProfileSaving(false);
        }
    };

    const handlePasswordSubmit = async (event) => {
        event.preventDefault();
        clearMessages();

        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError('Şifreler aynı değil');
            return;
        }

        if (passwordForm.newPassword.length < 6) {
            setError('Yeni şifre en az 6 karakter olmalı.');
            return;
        }

        setIsPasswordSaving(true);

        try {
            await changePassword({
                user: currentUser,
                newPassword: passwordForm.newPassword,
            });

            setPasswordForm({ newPassword: '', confirmPassword: '' });
            setStatusMessage('Şifren güncellendi.');
        } catch (err) {
            if (err.code === 'auth/requires-recent-login') {
                setError('Şifre değiştirmek için yakın zamanda giriş yapmış olman gerekiyor. Çıkış yapıp tekrar giriş yaptıktan sonra yeniden dene.');
            } else {
                setError(err.message);
            }
        } finally {
            setIsPasswordSaving(false);
        }
    };

    const handleSendVerification = async () => {
        clearMessages();
        setIsVerificationSending(true);

        try {
            await sendVerificationEmail(currentUser);
            setStatusMessage('Doğrulama e-postası gönderildi. Gelen kutunu kontrol et.');
        } catch (err) {
            setError(err.message);
        } finally {
            setIsVerificationSending(false);
        }
    };

    const handleSecureLogout = async () => {
        clearMessages();
        setIsLoggingOut(true);

        try {
            await logout();
            navigate('/', { replace: true });
        } catch (err) {
            setError(err.message);
            setIsLoggingOut(false);
        }
    };

    return (
        <section className="space-y-6">
            <div>
                <p className="text-sm font-medium text-emerald-700">Hesap merkezi</p>
                <h1 className="mt-2 text-3xl font-bold">Profil Ayarları</h1>
                <p className="mt-2 text-slate-600">Profil fotoğrafını, görünen adını, e-posta doğrulamanı ve şifreni buradan yönetebilirsin.</p>
            </div>

            {statusMessage && <p className="rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">{statusMessage}</p>}
            {error && <p className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <form className="space-y-5 rounded border bg-white p-6" onSubmit={handleProfileSubmit}>
                    <div className="flex items-center gap-4">
                        {photoPreview ? (
                            <img className="h-20 w-20 rounded-full object-cover" src={photoPreview} alt="Profil önizleme" />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-200 text-xl font-semibold text-slate-600">
                                {(profileForm.displayName || currentUser?.email || 'U').charAt(0).toUpperCase()}
                            </div>
                        )}

                        <div>
                            <h2 className="text-lg font-semibold">Profil Bilgileri</h2>
                            <p className="text-sm text-slate-500">JPG, PNG veya WEBP dosyası yükleyebilirsin. Maksimum 2 MB.</p>
                        </div>
                    </div>

                    <label className="block text-sm font-medium">
                        Profil fotoğrafı
                        <input
                            accept="image/jpeg,image/png,image/webp"
                            className="mt-2 block w-full text-sm"
                            onChange={handlePhotoChange}
                            type="file"
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Ad Soyad
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            name="displayName"
                            onChange={handleProfileInputChange}
                            type="text"
                            value={profileForm.displayName}
                        />
                    </label>

                    <label className="block text-sm font-medium">
                        Profil fotoğrafı URL
                        <input
                            className="mt-1 w-full rounded border px-3 py-2"
                            name="photoURL"
                            onChange={handleProfileInputChange}
                            placeholder="Dosya yüklemek istemezsen görsel URL'si yazabilirsin"
                            type="url"
                            value={profileForm.photoURL}
                        />
                    </label>

                    <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60" disabled={isProfileSaving} type="submit">
                        {isProfileSaving ? 'Kaydediliyor...' : 'Profili Kaydet'}
                    </button>
                </form>

                <div className="space-y-6">
                    <div className="rounded border bg-white p-6">
                        <h2 className="text-lg font-semibold">E-posta Doğrulama</h2>
                        <p className="mt-2 text-sm text-slate-600">{currentUser?.email}</p>
                        <p className={`mt-3 text-sm font-medium ${currentUser?.emailVerified ? 'text-emerald-700' : 'text-amber-700'}`}>
                            {currentUser?.emailVerified ? 'E-posta doğrulandı.' : 'E-posta henüz doğrulanmadı.'}
                        </p>
                        <button
                            className="mt-4 rounded border px-4 py-2 text-sm disabled:opacity-60"
                            disabled={currentUser?.emailVerified || isVerificationSending}
                            onClick={handleSendVerification}
                            type="button"
                        >
                            {isVerificationSending ? 'Gönderiliyor...' : 'Doğrulama E-postası Gönder'}
                        </button>
                    </div>

                    <form className="space-y-4 rounded border bg-white p-6" onSubmit={handlePasswordSubmit}>
                        <h2 className="text-lg font-semibold">Şifre Değiştir</h2>
                        <label className="block text-sm font-medium">
                            Yeni şifre
                            <input
                                className="mt-1 w-full rounded border px-3 py-2"
                                minLength={6}
                                name="newPassword"
                                onChange={handlePasswordInputChange}
                                type="password"
                                value={passwordForm.newPassword}
                            />
                        </label>
                        <label className="block text-sm font-medium">
                            Yeni şifre tekrar
                            <input
                                className="mt-1 w-full rounded border px-3 py-2"
                                minLength={6}
                                name="confirmPassword"
                                onChange={handlePasswordInputChange}
                                type="password"
                                value={passwordForm.confirmPassword}
                            />
                        </label>
                        <button className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-60" disabled={isPasswordSaving} type="submit">
                            {isPasswordSaving ? 'Güncelleniyor...' : 'Şifreyi Güncelle'}
                        </button>
                    </form>

                    <div className="rounded border bg-white p-6">
                        <h2 className="text-lg font-semibold">Güvenli Çıkış</h2>
                        <p className="mt-2 text-sm text-slate-600">Ortak bir cihaz kullanıyorsan hesabından çıkış yapman gerekir.</p>
                        <button
                            className="mt-4 rounded bg-red-600 px-4 py-2 text-white disabled:opacity-60"
                            disabled={isLoggingOut}
                            onClick={handleSecureLogout}
                            type="button"
                        >
                            {isLoggingOut ? 'Çıkış yapılıyor...' : 'Güvenli Çıkış Yap'}
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default ProfilePage;
