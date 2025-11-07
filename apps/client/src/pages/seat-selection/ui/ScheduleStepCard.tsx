import { ArrowLeft, Users } from 'lucide-react';
import { Button, Badge, Card, CardContent, CardHeader, CardTitle } from '@packages/design-system';

import type { Performance, PerformanceSchedule } from '@/entities/performance';

interface ScheduleStepCardProps {
  performance: Performance;
  schedules: PerformanceSchedule[];
  onBack: () => void;
  onSelectSchedule: (scheduleId: string) => void;
}

export function ScheduleStepCard({
  performance,
  schedules,
  onBack,
  onSelectSchedule,
}: ScheduleStepCardProps) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <CardTitle>{performance.title}</CardTitle>
            <p className="text-muted-foreground">{performance.venue}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <h3 className="text-base font-semibold">Select a Show Time</h3>
          {schedules.length === 0 ? (
            <p className="text-center text-muted-foreground">
              스케줄을 불러오는 중이거나 사용 가능한 스케줄이 없습니다.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              총 {schedules.length}개의 스케줄이 있습니다.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {schedules.map((schedule) => {
              const availableSeats = schedule.availableSeats ?? 0;
              const totalSeats = schedule.totalSeats ?? 0;
              const isOpen = schedule.status === 'OPEN' || availableSeats > 0;

              return (
                <Card
                  key={schedule.scheduleId}
                  className="cursor-pointer transition-colors hover:bg-accent"
                  onClick={() => onSelectSchedule(schedule.scheduleId.toString())}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {new Date(schedule.showDatetime).toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(schedule.showDatetime).toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="text-right space-y-1">
                        <Badge variant={isOpen ? 'default' : 'destructive'}>
                          {schedule.status ?? 'UNKNOWN'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          <Users className="w-3 h-3 inline mr-1" />
                          {availableSeats}/{totalSeats}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
