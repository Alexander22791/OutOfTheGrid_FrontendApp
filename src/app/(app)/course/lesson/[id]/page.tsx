'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { IoArrowBack, IoCheckmarkCircle, IoPlay, IoTimeOutline, IoVideocamOff } from 'react-icons/io5';
import api from '@/lib/api';
import { Button } from '@/components/Button';
import { Lesson } from '@/types';

const getYouTubeVideoId = (url?: string): string | null => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
};

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    const fetchLesson = async () => {
      try {
        const res = await api.get(`/lessons/${id}`);
        setLesson(res.data.lesson);
        setCompleted(res.data.is_completed || false);
      } catch (error) {
        console.error('Error fetching lesson:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLesson();
  }, [id]);

  const handleComplete = async () => {
    setCompleting(true);
    try {
      await api.post(`/lessons/${id}/complete`);
      setCompleted(true);
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (error) {
      console.error('Error completing lesson:', error);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-accent/30 border-t-accent" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-text-secondary">Lezione non trovata</p>
      </div>
    );
  }

  const videoId = getYouTubeVideoId(lesson.video_url);
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1` : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-4 pb-20 md:pb-6">
      <button
        onClick={() => router.back()}
        className="mb-4 flex items-center gap-2 text-text-secondary transition-colors hover:text-text-primary"
      >
        <IoArrowBack size={20} />
        Torna al corso
      </button>

      <div className="mb-4 overflow-hidden rounded-xl border border-border bg-background-card">
        <div className="aspect-video w-full bg-surface">
          {embedUrl ? (
            <iframe
              src={embedUrl}
              className="h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={lesson.title}
            />
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-text-muted">
              <IoVideocamOff size={42} />
              <p>Video non disponibile</p>
            </div>
          )}
        </div>

        <div className="p-5">
          <h1 className="mb-2 text-2xl font-bold text-text-primary">{lesson.title}</h1>
          {lesson.duration && (
            <div className="mb-3 flex items-center gap-1.5 text-sm text-text-secondary">
              <IoTimeOutline size={16} />
              <span>{lesson.duration} minuti</span>
            </div>
          )}
          {lesson.description && <p className="text-sm leading-relaxed text-text-secondary">{lesson.description}</p>}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-background-card p-5">
        {completed ? (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-success/15 p-3 text-success">
            <IoCheckmarkCircle size={22} />
            <span className="font-semibold">Lezione completata!</span>
          </div>
        ) : (
          <Button
            title="Segna come completata"
            onPress={handleComplete}
            loading={completing}
            icon={<IoPlay size={18} />}
            className="w-full"
          />
        )}
      </div>
    </div>
  );
}
