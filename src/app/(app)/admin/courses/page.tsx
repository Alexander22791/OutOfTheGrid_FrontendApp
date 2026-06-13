'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { IoAdd, IoBook, IoPencil, IoTrash } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { useAuthStore } from '@/store/authStore';
import { AdminHeader } from '@/components/AdminHeader';

interface AdminCourse { id: string; title: string; description?: string; rewardPoints?: number; accessType?: string; }
interface AdminModule { id: string; title: string; sortOrder?: number; lessons?: AdminLesson[]; }
interface AdminLesson { id: string; title: string; contentType?: string; durationMinutes?: number; sortOrder?: number; }
interface CityOption { id: string; name: string; }

const EMPTY_COURSE = { title: '', description: '', accessType: 'FREE', cityId: '', rewardPoints: '0' };
const EMPTY_MODULE = { title: '', sortOrder: '0' };
const EMPTY_LESSON = { title: '', contentType: 'text', contentText: '', videoUrl: '', durationMinutes: '', sortOrder: '0' };

export default function AdminCoursesPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [cities, setCities] = useState<CityOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCourse, setSavingCourse] = useState(false);
  const [courseForm, setCourseForm] = useState(EMPTY_COURSE);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [modules, setModules] = useState<AdminModule[]>([]);
  const [loadingModules, setLoadingModules] = useState(false);
  const [moduleForm, setModuleForm] = useState(EMPTY_MODULE);
  const [savingModule, setSavingModule] = useState(false);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [lessons, setLessons] = useState<AdminLesson[]>([]);
  const [lessonForm, setLessonForm] = useState(EMPTY_LESSON);
  const [savingLesson, setSavingLesson] = useState(false);
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cr, ci] = await Promise.all([api.get('/admin/courses'), api.get('/admin/cities')]);
      setCourses(cr.data ?? []); setCities(ci.data ?? []);
    } finally { setLoading(false); }
  };

  const fetchModules = async (courseId: string) => {
    setLoadingModules(true);
    try { const r = await api.get(`/admin/modules?courseId=${courseId}`); setModules(r.data ?? []); }
    finally { setLoadingModules(false); }
  };

  const fetchLessons = async (moduleId: string) => {
    try { const r = await api.get(`/admin/lessons?moduleId=${moduleId}`); setLessons(r.data ?? []); }
    catch { setLessons([]); }
  };

  useEffect(() => { if (user?.is_admin || user?.is_city_manager) queueMicrotask(() => { void fetchData(); }); }, [user?.is_admin, user?.is_city_manager]);

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim() || !courseForm.description.trim() || !courseForm.cityId) { window.alert('Titolo, descrizione e città sono obbligatori.'); return; }
    setSavingCourse(true);
    try { await api.post('/admin/courses', { title: courseForm.title.trim(), description: courseForm.description.trim(), accessType: courseForm.accessType, cityId: Number(courseForm.cityId), rewardPoints: Number(courseForm.rewardPoints || 0) }); setCourseForm(EMPTY_COURSE); await fetchData(); }
    finally { setSavingCourse(false); }
  };

  const handleDeleteCourse = async (id: string) => {
    if (!window.confirm('Eliminare questo corso?')) return;
    await api.delete(`/admin/courses/${id}`);
    if (selectedCourseId === id) { setSelectedCourseId(null); setModules([]); setSelectedModuleId(null); setLessons([]); }
    await fetchData();
  };

  const handleSelectCourse = async (id: string) => {
    if (selectedCourseId === id) { setSelectedCourseId(null); setModules([]); setSelectedModuleId(null); setLessons([]); return; }
    setSelectedCourseId(id); setSelectedModuleId(null); setLessons([]); await fetchModules(id);
  };

  const handleCreateModule = async () => {
    if (!moduleForm.title.trim() || !selectedCourseId) return;
    setSavingModule(true);
    try { await api.post('/admin/modules', { courseId: Number(selectedCourseId), title: moduleForm.title.trim(), sortOrder: Number(moduleForm.sortOrder || 0) }); setModuleForm(EMPTY_MODULE); await fetchModules(selectedCourseId); }
    finally { setSavingModule(false); }
  };

  const handleDeleteModule = async (id: string) => {
    if (!window.confirm('Eliminare questo modulo e tutte le sue lezioni?')) return;
    await api.delete(`/admin/modules/${id}`);
    if (selectedModuleId === id) { setSelectedModuleId(null); setLessons([]); }
    if (selectedCourseId) await fetchModules(selectedCourseId);
  };

  const handleSelectModule = async (id: string) => {
    if (selectedModuleId === id) { setSelectedModuleId(null); setLessons([]); return; }
    setSelectedModuleId(id); await fetchLessons(id);
  };

  const handleCreateLesson = async () => {
    if (!lessonForm.title.trim() || !selectedModuleId) return;
    setSavingLesson(true);
    try { await api.post('/admin/lessons', { moduleId: Number(selectedModuleId), title: lessonForm.title.trim(), contentType: lessonForm.contentType, contentText: lessonForm.contentText || undefined, videoUrl: lessonForm.videoUrl || undefined, durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : undefined, sortOrder: Number(lessonForm.sortOrder || 0) }); setLessonForm(EMPTY_LESSON); await fetchLessons(selectedModuleId); }
    finally { setSavingLesson(false); }
  };

  const handleUpdateLesson = async (id: string) => {
    setSavingLesson(true);
    try { await api.put(`/admin/lessons/${id}`, { title: lessonForm.title.trim() || undefined, contentType: lessonForm.contentType || undefined, contentText: lessonForm.contentText || undefined, videoUrl: lessonForm.videoUrl || undefined, durationMinutes: lessonForm.durationMinutes ? Number(lessonForm.durationMinutes) : undefined }); setEditingLessonId(null); setLessonForm(EMPTY_LESSON); if (selectedModuleId) await fetchLessons(selectedModuleId); }
    finally { setSavingLesson(false); }
  };

  const handleDeleteLesson = async (id: string) => {
    if (!window.confirm('Eliminare questa lezione?')) return;
    await api.delete(`/admin/lessons/${id}`); if (selectedModuleId) await fetchLessons(selectedModuleId);
  };

  if (!user?.is_admin && !user?.is_city_manager) return <div className="mx-auto max-w-2xl px-4 py-10 text-center text-text-secondary">Accesso riservato.</div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 pb-20 md:pb-6">
      <AdminHeader title="Gestione corsi" subtitle="Crea corsi, moduli e lezioni." />

      <div className="mb-6 rounded-xl border border-border bg-background-card p-5">
        <div className="mb-4 flex items-center gap-2"><IoBook size={18} className="text-accent" /><h2 className="font-semibold text-text-primary">Nuovo corso</h2></div>
        <div className="grid gap-4 md:grid-cols-2">
          <Input label="Titolo" value={courseForm.title} onChange={(v) => setCourseForm((c) => ({ ...c, title: v }))} />
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Accesso</label>
            <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" value={courseForm.accessType} onChange={(e) => setCourseForm((c) => ({ ...c, accessType: e.target.value }))}>
              <option value="FREE">Gratuito</option><option value="SUBSCRIPTION">Abbonamento</option>
            </select>
          </div>
        </div>
        <Input label="Descrizione" value={courseForm.description} onChange={(v) => setCourseForm((c) => ({ ...c, description: v }))} multiline rows={3} />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-text-secondary">Città</label>
            <select className="w-full rounded-lg border border-border bg-surface px-4 py-3 text-text-primary" value={courseForm.cityId} onChange={(e) => setCourseForm((c) => ({ ...c, cityId: e.target.value }))}>
              <option value="">Seleziona città</option>
              {cities.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Input label="Reward points" type="number" value={courseForm.rewardPoints} onChange={(v) => setCourseForm((c) => ({ ...c, rewardPoints: v }))} />
        </div>
        <Button title="Crea corso" onPress={handleSaveCourse} loading={savingCourse} icon={<IoAdd size={18} />} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
      ) : (
        <div className="space-y-4">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-border bg-background-card">
              <div className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="font-semibold text-text-primary">{course.title}</h2>
                  <p className="text-sm text-text-secondary">{course.description || 'Nessuna descrizione'}</p>
                  <p className="text-xs text-text-muted">Reward: {course.rewardPoints ?? 0} pt · {course.accessType ?? 'FREE'}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => void handleSelectCourse(course.id)} className={['rounded-lg border px-3 py-2 text-sm transition-colors', selectedCourseId === course.id ? 'border-accent bg-accent/10 text-accent' : 'border-border text-text-secondary hover:border-accent/50'].join(' ')}>
                    {selectedCourseId === course.id ? 'Chiudi' : 'Moduli'}
                  </button>
                  <button type="button" onClick={() => router.push(`/course/${course.id}`)} className="rounded-lg border border-border px-3 py-2 text-sm text-text-secondary hover:border-accent/50">Anteprima</button>
                  <button type="button" onClick={() => void handleDeleteCourse(course.id)} className="rounded-lg border border-error/40 px-3 py-2 text-sm text-error hover:bg-error/10"><IoTrash size={16} /></button>
                </div>
              </div>

              {selectedCourseId === course.id && (
                <div className="border-t border-border p-5">
                  <h3 className="mb-3 font-semibold text-text-primary">Moduli</h3>
                  <div className="mb-4 flex gap-2">
                    <div className="flex-1"><Input label="" placeholder="Titolo modulo" value={moduleForm.title} onChange={(v) => setModuleForm((m) => ({ ...m, title: v }))} /></div>
                    <div className="w-24"><Input label="" placeholder="Ordine" type="number" value={moduleForm.sortOrder} onChange={(v) => setModuleForm((m) => ({ ...m, sortOrder: v }))} /></div>
                    <div><Button title="Aggiungi" onPress={handleCreateModule} loading={savingModule} size="sm" /></div>
                  </div>

                  {loadingModules ? (
                    <div className="flex justify-center py-4"><span className="h-6 w-6 animate-spin rounded-full border-4 border-accent/30 border-t-accent" /></div>
                  ) : modules.length === 0 ? (
                    <p className="text-sm text-text-muted">Nessun modulo.</p>
                  ) : (
                    <div className="space-y-2">
                      {modules.map((mod) => (
                        <div key={mod.id} className="rounded-lg border border-border bg-surface">
                          <div className="flex items-center justify-between px-4 py-3">
                            <button type="button" onClick={() => void handleSelectModule(mod.id)} className="flex-1 text-left text-sm font-medium text-text-primary hover:text-accent">
                              {mod.title} <span className="ml-2 text-xs text-text-muted">{selectedModuleId === mod.id ? '▲' : '▼'} lezioni</span>
                            </button>
                            <button type="button" onClick={() => void handleDeleteModule(mod.id)} className="text-error hover:text-error/80"><IoTrash size={14} /></button>
                          </div>

                          {selectedModuleId === mod.id && (
                            <div className="border-t border-border px-4 py-3">
                              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-text-muted">Lezioni</h4>
                              <div className="mb-3 space-y-2 rounded-lg border border-border bg-background-card p-3">
                                <p className="text-xs font-medium text-text-secondary">{editingLessonId ? 'Modifica lezione' : 'Nuova lezione'}</p>
                                <Input label="" placeholder="Titolo lezione" value={lessonForm.title} onChange={(v) => setLessonForm((l) => ({ ...l, title: v }))} />
                                <div className="grid gap-2 md:grid-cols-2">
                                  <div>
                                    <label className="mb-1 block text-xs text-text-secondary">Tipo contenuto</label>
                                    <select className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary" value={lessonForm.contentType} onChange={(e) => setLessonForm((l) => ({ ...l, contentType: e.target.value }))}>
                                      <option value="text">Testo</option><option value="video">Video</option><option value="file">File</option>
                                    </select>
                                  </div>
                                  <Input label="" placeholder="Durata (min)" type="number" value={lessonForm.durationMinutes} onChange={(v) => setLessonForm((l) => ({ ...l, durationMinutes: v }))} />
                                </div>
                                {lessonForm.contentType === 'text' && <Input label="" placeholder="Contenuto testo" value={lessonForm.contentText} onChange={(v) => setLessonForm((l) => ({ ...l, contentText: v }))} multiline rows={3} />}
                                {lessonForm.contentType === 'video' && <Input label="" placeholder="URL video" value={lessonForm.videoUrl} onChange={(v) => setLessonForm((l) => ({ ...l, videoUrl: v }))} />}
                                <div className="flex gap-2">
                                  <Button title={editingLessonId ? 'Salva' : 'Aggiungi lezione'} onPress={editingLessonId ? () => handleUpdateLesson(editingLessonId) : handleCreateLesson} loading={savingLesson} size="sm" />
                                  {editingLessonId && <Button title="Annulla" variant="outline" size="sm" onPress={() => { setEditingLessonId(null); setLessonForm(EMPTY_LESSON); }} />}
                                </div>
                              </div>
                              {lessons.length === 0 ? <p className="text-xs text-text-muted">Nessuna lezione.</p> : (
                                <div className="space-y-1">
                                  {lessons.map((lesson) => (
                                    <div key={lesson.id} className="flex items-center justify-between rounded-lg border border-border bg-background-card px-3 py-2">
                                      <div><p className="text-sm text-text-primary">{lesson.title}</p><p className="text-xs text-text-muted">{lesson.contentType} · {lesson.durationMinutes ?? 0} min</p></div>
                                      <div className="flex gap-2">
                                        <button type="button" onClick={() => { setEditingLessonId(lesson.id); setLessonForm({ title: lesson.title, contentType: lesson.contentType ?? 'text', contentText: '', videoUrl: '', durationMinutes: String(lesson.durationMinutes ?? ''), sortOrder: String(lesson.sortOrder ?? 0) }); }} className="text-text-secondary hover:text-accent"><IoPencil size={14} /></button>
                                        <button type="button" onClick={() => void handleDeleteLesson(lesson.id)} className="text-error hover:text-error/80"><IoTrash size={14} /></button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
