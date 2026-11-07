import { useEffect, useState, type FormEvent } from 'react';
import { ImagePlus, LogOut, Trash2 } from 'lucide-react';
import { defaultSiteSettings, type SiteSettings } from '../data/contact';
import { useSiteSettings } from '../context/SiteSettingsContext';
import { services } from '../data/services';

type UploadedPhoto = {
  id: string;
  title: string;
  description: string;
  image: string;
  uploadedAt: string;
};

async function readError(response: Response) {
  const result = await response.json().catch(() => ({}));
  return typeof result.error === 'string' ? result.error : 'Не удалось выполнить действие. Попробуйте ещё раз.';
}

function fileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('Не удалось прочитать фото.'));
    reader.onerror = () => reject(new Error('Не удалось прочитать фото.'));
    reader.readAsDataURL(file);
  });
}

export function Admin() {
  const { settings, setSettings, loading: settingsLoading } = useSiteSettings();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [settingsDraft, setSettingsDraft] = useState<SiteSettings>(defaultSiteSettings);
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyPhotoId, setBusyPhotoId] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!settingsLoading) setSettingsDraft(settings);
  }, [settings, settingsLoading]);

  const loadPhotos = async () => {
    const response = await fetch('/api/gallery', { cache: 'no-store' });
    if (!response.ok) throw new Error('Не удалось загрузить список фотографий.');
    setPhotos(await response.json() as UploadedPhoto[]);
  };

  useEffect(() => {
    let active = true;
    fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('Сервер админ-панели недоступен. Запустите сайт командой npm run dev.');
        const result = await response.json() as { authenticated: boolean };
        if (!active) return;
        setAuthenticated(result.authenticated);
        if (result.authenticated) await loadPhotos();
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setAuthenticated(false);
        setError(reason instanceof Error ? reason.message : 'Не удалось подключиться к серверу.');
      });
    return () => { active = false; };
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const password = String(new FormData(event.currentTarget).get('password') ?? '');
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!response.ok) throw new Error(await readError(response));
      setAuthenticated(true);
      await loadPhotos();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось войти.');
    } finally {
      setBusy(false);
    }
  };

  const handleUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const file = formData.get('image');
    if (!(file instanceof File) || file.size === 0) {
      setError('Выберите фотографию.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError('Размер фотографии не должен превышать 8 МБ.');
      return;
    }

    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: String(formData.get('title') ?? ''),
          description: String(formData.get('description') ?? ''),
          dataUrl: await fileAsDataUrl(file),
        }),
      });
      if (!response.ok) throw new Error(await readError(response));
      form.reset();
      await loadPhotos();
      setNotice('Фотография добавлена в галерею сайта.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось загрузить фотографию.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (photo: UploadedPhoto) => {
    if (!window.confirm(`Удалить фото «${photo.title}» из сайта?`)) return;
    setBusyPhotoId(photo.id);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/photos/${photo.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error(await readError(response));
      await loadPhotos();
      setNotice('Фотография удалена из галереи.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось удалить фотографию.');
    } finally {
      setBusyPhotoId('');
    }
  };

  const handleSettingsSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsDraft),
      });
      if (!response.ok) throw new Error(await readError(response));
      const saved = await response.json() as SiteSettings;
      setSettings(saved);
      setSettingsDraft(saved);
      setNotice('Настройки сайта сохранены. Они уже применены на сайте.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Не удалось сохранить настройки.');
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setAuthenticated(false);
    setPhotos([]);
  };

  if (authenticated === null) {
    return <main className="admin-page"><p>Подключаюсь к админ-панели…</p></main>;
  }

  if (!authenticated) {
    return <main className="admin-page">
      <section className="admin-login-card">
        <a className="admin-back-link" href="/">← Price Nails Studio</a>
        <p className="section-kicker">Администрация</p>
        <h1>Вход в админ-панель</h1>
        <p className="admin-description">Войдите, чтобы менять цены, контакты, ссылки и фотографии на сайте.</p>
        <form className="admin-form" onSubmit={handleLogin}>
          <label htmlFor="admin-password">Пароль</label>
          <input id="admin-password" name="password" type="password" autoComplete="current-password" required />
          <button className="booking-submit" type="submit" disabled={busy}>{busy ? 'Входим…' : 'Войти'}</button>
        </form>
        {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      </section>
    </main>;
  }

  return <main className="admin-page admin-dashboard">
    <header className="admin-header">
      <div><p className="section-kicker">Price Nails Studio</p><h1>Управление сайтом</h1></div>
      <div className="admin-header-actions"><a href="/" className="admin-secondary-button">Открыть сайт</a><button className="admin-secondary-button" type="button" onClick={handleLogout}><LogOut size={16} /> Выйти</button></div>
    </header>

    <section className="admin-upload-card admin-settings-card">
      <div className="admin-section-title"><div><h2>Контакты, ссылки и цены</h2><p>Измените данные здесь — они автоматически обновятся на сайте.</p></div></div>
      <form className="admin-form admin-settings-form" onSubmit={handleSettingsSave}>
        <div className="admin-settings-grid">
          <label htmlFor="settings-phone">Телефон</label>
          <input id="settings-phone" type="tel" value={settingsDraft.phoneNumber} onChange={(event) => setSettingsDraft({ ...settingsDraft, phoneNumber: event.target.value })} placeholder="+33 …" />
          <label htmlFor="settings-whatsapp">WhatsApp</label>
          <input id="settings-whatsapp" type="tel" value={settingsDraft.whatsappNumber} onChange={(event) => setSettingsDraft({ ...settingsDraft, whatsappNumber: event.target.value })} placeholder="+33 …" />
          <label htmlFor="settings-email">Электронная почта</label>
          <input id="settings-email" type="email" value={settingsDraft.emailAddress} onChange={(event) => setSettingsDraft({ ...settingsDraft, emailAddress: event.target.value })} placeholder="name@example.com" />
          <label htmlFor="settings-address">Адрес студии</label>
          <input id="settings-address" type="text" value={settingsDraft.studioAddress} onChange={(event) => setSettingsDraft({ ...settingsDraft, studioAddress: event.target.value })} />
          <label htmlFor="settings-city">Город в шапке сайта</label>
          <input id="settings-city" type="text" value={settingsDraft.studioCity} onChange={(event) => setSettingsDraft({ ...settingsDraft, studioCity: event.target.value })} />
          <label htmlFor="settings-instagram">Ссылка Instagram</label>
          <input id="settings-instagram" type="url" value={settingsDraft.instagramHref} onChange={(event) => setSettingsDraft({ ...settingsDraft, instagramHref: event.target.value })} placeholder="https://…" />
          <label htmlFor="settings-facebook">Ссылка Facebook</label>
          <input id="settings-facebook" type="url" value={settingsDraft.facebookHref} onChange={(event) => setSettingsDraft({ ...settingsDraft, facebookHref: event.target.value })} placeholder="https://…" />
        </div>
        <h3 className="admin-prices-title">Стоимость услуг</h3>
        <p className="admin-settings-hint">Можно написать цену, диапазон или «от … €». Оставьте поле пустым, чтобы цена не показывалась.</p>
        <div className="admin-settings-grid admin-price-grid">
          {services.map((service) => <div className="admin-price-row" key={service.id}>
            <label htmlFor={`price-${service.id}`}>{service.id === 'shade-match' ? 'Подбор стиля и цвета' : service.id === 'classic-manicure' ? 'Маникюр и покрытие' : service.id === 'nail-design' ? 'Дизайн ногтей' : 'Уход за ногтями'}</label>
            <input id={`price-${service.id}`} type="text" maxLength={40} value={settingsDraft.servicePrices[service.id] ?? ''} onChange={(event) => setSettingsDraft({ ...settingsDraft, servicePrices: { ...settingsDraft.servicePrices, [service.id]: event.target.value } })} placeholder="Например, от 35 €" />
          </div>)}
        </div>
        <button className="booking-submit" type="submit" disabled={busy}>{busy ? 'Сохраняю…' : 'Сохранить настройки'}</button>
      </form>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-success" role="status">{notice}</p>}
    </section>

    <section className="admin-upload-card">
      <div className="admin-section-title"><ImagePlus size={21} /><div><h2>Добавить фото в галерею</h2><p>JPG, PNG или WebP, до 8 МБ. Заголовок будет показываться на всех языках сайта.</p></div></div>
      <form className="admin-form admin-upload-form" onSubmit={handleUpload}>
        <label htmlFor="photo-title">Название</label>
        <input id="photo-title" name="title" type="text" maxLength={80} required placeholder="Например: Нежный нюд" />
        <label htmlFor="photo-description">Короткое описание <span>(необязательно)</span></label>
        <textarea id="photo-description" name="description" rows={3} maxLength={240} placeholder="Расскажите об этом дизайне" />
        <label htmlFor="photo-file">Фотография</label>
        <input id="photo-file" name="image" type="file" accept="image/jpeg,image/png,image/webp" required />
        <button className="booking-submit" type="submit" disabled={busy}><ImagePlus size={17} />{busy ? 'Загружаю…' : 'Добавить в галерею'}</button>
      </form>
      {error && <p className="admin-message admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-message admin-success" role="status">{notice}</p>}
    </section>

    <section className="admin-gallery-section">
      <div className="admin-gallery-heading"><h2>Фото на сайте</h2><span>{photos.length}</span></div>
      {photos.length === 0 ? <p className="admin-empty">Вы ещё не добавили фотографии.</p> : <div className="admin-gallery-grid">
        {photos.map((photo) => <article className="admin-photo-card" key={photo.id}>
          <img src={photo.image} alt={photo.title} />
          <div className="admin-photo-info"><div><h3>{photo.title}</h3>{photo.description && <p>{photo.description}</p>}</div><button type="button" className="admin-delete-button" aria-label={`Удалить фото ${photo.title}`} disabled={busyPhotoId === photo.id} onClick={() => handleDelete(photo)}><Trash2 size={17} /></button></div>
        </article>)}
      </div>}
    </section>
  </main>;
}
