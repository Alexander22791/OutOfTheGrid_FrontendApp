'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { IoChevronForward, IoFolderOutline, IoSchoolOutline } from 'react-icons/io5';
import api from '@/lib/api';
import { Course } from '@/types';

export default function ClassroomPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await api.get('/courses');
        setCourses(response.data);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  return (
    <>
      <div className="mx-auto max-w-2xl px-4 py-6 pb-24 md:pb-6">
        <div className="mb-6">
          <h1 className="mb-1 text-2xl font-bold text-text-primary">I tuoi corsi</h1>
          <p className="text-sm text-text-secondary">Percorsi formativi verso l&apos;autosufficienza.</p>
        </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <IoSchoolOutline size={64} className="text-text-muted" />
          <p className="font-medium text-text-primary">Nessun corso disponibile</p>
          <p className="text-sm text-text-secondary">I corsi saranno presto aggiunti.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <button
              key={String(course.id)}
              onClick={() => router.push(`/course/${course.id}`)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-background-card p-4 text-left transition-colors hover:border-accent/40"
            >
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                {course.thumbnail ? (
                  <Image src={course.thumbnail} alt={course.title} width={80} height={80} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-surface">
                    <IoSchoolOutline size={32} className="text-accent" />
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h3 className="mb-1 line-clamp-2 font-semibold text-text-primary">{course.title}</h3>
                <p className="line-clamp-2 text-sm text-text-secondary">{course.description}</p>
                <div className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                  <IoFolderOutline size={14} />
                  <span>{course.modules?.length ?? 0} moduli</span>
                </div>
              </div>

              <IoChevronForward size={22} className="shrink-0 text-text-secondary" />
            </button>
          ))}
        </div>
      )}
      </div>
    </>
  );
}
