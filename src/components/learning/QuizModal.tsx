import { useEffect, useState } from 'react';
import { Loader2, Award, CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { apiClient } from '@/lib/apiClient';
import { toast } from 'sonner';

interface QuizModalProps {
  moduleId: string;
  moduleLabel: string;
  open: boolean;
  onClose: () => void;
  onCertificateAwarded: () => void;
}

type QuizQuestion = { id: string; question: string; options: string[] };
type GradeResult = Awaited<ReturnType<typeof apiClient.submitModuleQuiz>>;

export const QuizModal = ({ moduleId, moduleLabel, open, onClose, onCertificateAwarded }: QuizModalProps) => {
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GradeResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setQuestions(null);
    setAnswers({});
    setResult(null);
    apiClient
      .getModuleQuiz(moduleId)
      .then((data) => setQuestions(data.questions))
      .catch((err) => {
        toast.error(err.message || 'Failed to load quiz');
        onClose();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, moduleId]);

  const allAnswered = questions ? questions.every((q) => answers[q.id] !== undefined) : false;

  const handleSubmit = async () => {
    if (!questions) return;
    setSubmitting(true);
    try {
      const graded = await apiClient.submitModuleQuiz(moduleId, questions.map((q) => answers[q.id]));
      setResult(graded);
      if (graded.certificateAwarded) {
        toast.success(`Certificate earned for ${moduleLabel}!`);
        onCertificateAwarded();
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetake = () => {
    setAnswers({});
    setResult(null);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            {moduleLabel} quiz
          </DialogTitle>
        </DialogHeader>

        {!questions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : result ? (
          <div className="space-y-4">
            <div className={`rounded-lg border p-4 text-center ${result.passed ? 'border-primary/40 bg-primary/5' : 'border-destructive/40 bg-destructive/5'}`}>
              <p className="text-2xl font-bold">{result.score}/{result.total}</p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.passed ? "You passed! Your certificate is ready." : "Not quite -- review the explanations below and try again."}
              </p>
            </div>

            <div className="space-y-3">
              {questions.map((q, i) => {
                const r = result.results[i];
                return (
                  <div key={q.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-start gap-2">
                      {r.correct ? (
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{q.question}</p>
                        {!r.correct && (
                          <p className="text-xs text-muted-foreground mt-1">Correct answer: {q.options[r.correctIndex]}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">{r.explanation}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2">
              {!result.passed && (
                <Button variant="outline" className="gap-2" onClick={handleRetake}>
                  <RotateCcw className="w-4 h-4" />
                  Try again
                </Button>
              )}
              <Button onClick={onClose}>{result.passed ? 'Done' : 'Close'}</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, i) => (
              <div key={q.id} className="space-y-2">
                <p className="text-sm font-medium">{i + 1}. {q.question}</p>
                <RadioGroup
                  value={answers[q.id]?.toString() ?? ''}
                  onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: parseInt(v, 10) }))}
                >
                  {q.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-2">
                      <RadioGroupItem value={oi.toString()} id={`${q.id}-${oi}`} />
                      <Label htmlFor={`${q.id}-${oi}`} className="text-sm font-normal cursor-pointer">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            ))}
            <Button className="w-full" disabled={!allAnswered || submitting} onClick={handleSubmit}>
              {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Submit answers
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
