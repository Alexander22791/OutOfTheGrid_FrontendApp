'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  IoArrowBack,
  IoCheckmark,
  IoChevronDown,
  IoChevronUp,
  IoLockClosed,
  IoPlay,
} from 'react-icons/io5';
import api, { getApiErrorMessage } from '@/lib/api';
import { Course, Module, UserCourseProgress } from '@/types';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [progress, setProgress] = useState<UserCourseProgress | null>(null);
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [purchasing, setPurchasing] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      // GET /api/courses/{id} — restituisce { course, modules, progress, can_access }
      const res = await api.get(`/courses/${id}`);
      const data = res.data as {
        course?: Course;
        modules?: Module[];
        progress?: UserCourseProgress;
        can_access?: boolean;
        // backend può restituire il corso direttamente al top level
        id?: string | number;
        title?: string;
        progressPercent?: number;
        completed?: boolean;
      };

      // Supporta sia { course: {...}, modules: [...] } sia il corso direttamente
      const courseData: Course = data.course ?? (data as unknown as Course);
      const modulesData: Module[] = data.modules ?? courseData.modules ?? [];
      const progressData: UserCourseProgress | null = data.progress ?? null;
      const access: boolean = data.can_access ?? courseData.can_access ?? false;

      setCourse(courseData);
      setModules(modulesData);
      setProgress(progressData);
      setCanAccess(access);

      if (modulesData.length > 0) {
        setExpandedModules((prev) => (prev.length > 0 ? prev : [String(modulesData[0].id)]));
      }
    } catch {
      alert('Impossibile caricare il corso');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    queueMicrotask(() => {
      void fetchCourse();
    });
  }, [fetchCourse]);

  const toggleModule = (moduleId: string) => {
    setExpandedModules((prev) =>
      prev.includes(moduleId) ? prev.filter((m) => m !== moduleId) : [...prev, moduleId]
    );
  };

  const handlePurchase = async () => {
    if (purchasing) return;
    setPurchasing(true);
    try {
      const res = await api.post(`/courses/${id}/purchase`);
      const data = res.data as { checkout_url?: string };
      if (data?.checkout_url) {
        window.open(data.checkout_url, '_blank', 'noopener,noreferrer');
      } else {
        alert('Corso sbloccato!');
        await fetchCourse();
      }
    } catch (error: unknown) {
      alert(getApiErrorMessage(error, 'Impossibile acquistare il corso'));
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  if (!course) return null;

  // progressPercent viene dal backend come campo su UserCourseProgress
  const pct = progress ? Math.round(progress.progressPercent ?? 0) : 0;

  return (
    <div className="mx-auto max-w-2xl px-4 py-4 pb-20 md:pb-4">
      {/* Cover */}
      <div className="relative mb-4 h-44 w-full overflow-hidden rounded-xl">
        {course.image_url ?? course.thumbnail ? (
          <Image
            src={(course.image_url ?? course.thumbnail) as string}
            alt={course.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface">
            <IoPlay size={48} className="text-accent" />
          </div>
        )}
        <button
          onClick={() => router.back()}
          className="absolute left-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm transition-colors hover:bg-black/80"
        >
          <IoArrowBack size={20} className="text-white" />
        </button>
      </div>

      <h1 className="mb-2 text-2xl font-bold text-text-primary">{course.title}</h1>

      {/* Barra progresso */}
      {progress && (
        <div className="mb-4 rounded-xl border border-border bg-background-card p-4">
          <div className="mb-1.5 flex items-center justify-between">
            <span className="text-sm text-text-secondary">Il tuo progresso</span>
            <span className="text-sm font-semibold text-accent">{pct}%</span>
          </div>
          <div className="mb-1 h-2 overflow-hidden rounded-full bg-surface">
            <div
              className="h-full rounded-full bg-accent transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          {progress.completed && (
            <p className="mt-1 text-xs font-medium text-accent">Corso completato ✓</p>
          )}
        </div>
      )}

      {course.description && (
        <p className="mb-4 text-sm leading-relaxed text-text-secondary">{course.description}</p>
      )}

      {/* Lock se non ha accesso */}
      {!canAccess && (
        <div className="mb-4 rounded-xl border border-border bg-background-card p-6 text-center">
          <IoLockClosed size={40} className="mx-auto mb-3 text-warning" />
          <h3 className="mb-2 text-lg font-bold text-text-primary">Corso a pagamento</h3>
          <p className="mb-4 text-sm text-text-secondary">
            Acquista il corso per accedere a tutti i contenuti.
          </p>
          <button
            onClick={handlePurchase}
            disabled={purchasing}
            className="rounded-xl bg-accent px-6 py-3 font-semibold text-white transition-colors hover:bg-accent-light disabled:opacity-50"
          >
            {purchasing ? 'Caricamento...' : 'Acquista accesso'}
          </button>
        </div>
      )}

      {/* Moduli */}
      <h2 className="mb-3 text-lg font-semibold text-text-primary">Contenuto del corso</h2>
      <div className="space-y-2">
        {modules.map((module, index) => (
          <div
            key={String(module.id)}
            className="overflow-hidden rounded-xl border border-border bg-background-card"
          >
            <button
              onClick={() => toggleModule(String(module.id))}
              className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/50"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent/20 text-xs font-bold text-accent">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary">{module.title}</p>
                <p className="text-xs text-text-muted">{module.lessons?.length ?? 0} lezioni</p>
              </div>
              {expandedModules.includes(String(module.id)) ? (
                <IoChevronUp size={18} className="shrink-0 text-text-secondary" />
              ) : (
                <IoChevronDown size={18} className="shrink-0 text-text-secondary" />
              )}
            </button>

            {expandedModules.includes(String(module.id)) && (
              <div className="divide-y divide-border border-t border-border">
                {module.lessons?.map((lesson) => {
                  const isCompleted = lesson.completed ?? false;
                  return (
                    <button
                      key={String(lesson.id)}
                      onClick={() =>
                        canAccess && router.push(`/course/lesson/${lesson.id}`)
                      }
                      disabled={!canAccess}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface/30 disabled:cursor-default"
                    >
                      <div
                        className={[
                          'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border',
                          isCompleted ? 'border-accent bg-accent' : 'border-border',
                        ].join(' ')}
                      >
                        {isCompleted ? (
                          <IoCheckmark size={14} className="text-white" />
                        ) : (
                          <IoPlay size={12} className="text-accent" />
                        )}
                      </div>
                      <p
                        className={[
                          'flex-1 text-sm',
                          isCompleted ? 'text-text-secondary line-through' : 'text-text-primary',
                        ].join(' ')}
                      >
                        {lesson.title}
                      </p>
                      {lesson.duration && (
                        <span className="shrink-0 text-xs text-text-muted">{lesson.duration} min</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}

        {modules.length === 0 && (
          <div className="rounded-xl border border-border bg-background-card p-6 text-center text-sm text-text-secondary">
            Nessun modulo disponibile per questo corso.
          </div>
        )}
      </div>
    </div>
  );
}
