import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Input,
  Label,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@packages/design-system';

import { Plus, Edit, Trash2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import type { PerformanceDto, PerformanceRequest, VenueDto } from '@packages/shared';
import { venueService } from '@packages/shared';
import { adminPerformanceService } from '@/shared/api';
import { formatDate, formatPrice, getStatusColor } from '@/shared/lib';
import { StatCard, PulseLoadingSkeleton } from '@/shared/ui';

// PerformanceForm을 별도 컴포넌트로 분리
function PerformanceForm({
  formData,
  setFormData,
  venues,
  onSubmit,
  onCancel,
  isEdit = false,
}: {
  formData: any;
  setFormData: (data: any) => void;
  venues: VenueDto[];
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, title: e.target.value }))}
          placeholder="Performance title"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, description: e.target.value }))}
          placeholder="Performance description"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select
            value={formData.theme}
            onValueChange={(value: any) => setFormData((prev: any) => ({ ...prev, theme: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select theme" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Musical">Musical</SelectItem>
              <SelectItem value="Ballet">Ballet</SelectItem>
              <SelectItem value="Concert">Concert</SelectItem>
              <SelectItem value="Opera">Opera</SelectItem>
              <SelectItem value="Theater">Theater</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="venue">Venue</Label>
          <Select
            value={formData.venueId.toString()}
            onValueChange={(value: string) =>
              setFormData((prev: any) => ({ ...prev, venueId: parseInt(value) }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select venue" />
            </SelectTrigger>
            <SelectContent>
              {venues.map((venue) => (
                <SelectItem key={venue.venueId} value={venue.venueId.toString()}>
                  {venue.venueName} ({venue.totalCapacity} seats)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="poster_url">Poster Image</Label>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('poster-file-input')?.click()}
            className="w-fit"
          >
            Choose File
          </Button>
          <span className="text-sm text-gray-500">
            {formData.posterImage?.name || 'No file selected'}
          </span>
        </div>
        <input
          id="poster-file-input"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) =>
            setFormData((prev: any) => ({ ...prev, posterImage: e.target.files?.[0] || null }))
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="start_date">Start Date</Label>
          <Input
            id="start_date"
            type="date"
            value={formData.startDate}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, startDate: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="end_date">End Date</Label>
          <Input
            id="end_date"
            type="date"
            value={formData.endDate}
            onChange={(e) => setFormData((prev: any) => ({ ...prev, endDate: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="running_time">Running Time (minutes)</Label>
          <Input
            id="running_time"
            type="number"
            value={formData.runningTime}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, runningTime: parseInt(e.target.value) || 0 }))
            }
            placeholder="120"
          />
        </div>

        <div>
          <Label htmlFor="base_price">Base Price (KRW)</Label>
          <Input
            id="base_price"
            type="number"
            value={formData.basePrice}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, basePrice: parseInt(e.target.value) || 0 }))
            }
            placeholder="50000"
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>{isEdit ? 'Update' : 'Create'} Performance</Button>
      </div>
    </div>
  );
}

function ScheduleForm({
  formData,
  setFormData,
  performances,
  onSubmit,
  onCancel,
  isEdit = false,
}: {
  formData: any;
  setFormData: (data: any) => void;
  performances: PerformanceDto[];
  onSubmit: () => void;
  onCancel: () => void;
  isEdit?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="performance">Performance</Label>
          <Select
            value={formData.performance?.performanceId?.toString() || ''}
            onValueChange={(value: string) => {
              const selectPerformance = performances.find(
                (p) => p.performanceId === parseInt(value),
              );
              setFormData((prev: any) => ({ ...prev, performance: selectPerformance }));
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Performance" />
            </SelectTrigger>
            <SelectContent>
              {performances.map((performance) => (
                <SelectItem
                  key={performance.performanceId}
                  value={performance.performanceId.toString()}
                >
                  {performance.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: any) => setFormData((prev: any) => ({ ...prev, status: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">OPEN</SelectItem>
              <SelectItem value="CLOSED">CLOSED</SelectItem>
              <SelectItem value="SOLDOUT">SOLDOUT</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="show_datetime">Show Date time</Label>
          <Input
            id="show_datetime"
            type="datetime-local"
            value={formData.showDatetime || ''}
            onChange={(e) =>
              setFormData((prev: any) => ({ ...prev, showDatetime: e.target.value }))
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={onSubmit}>{isEdit ? 'Update' : 'Create'} Schedule</Button>
      </div>
    </div>
  );
}

export default function AdminPerformancesPage() {
  const [performances, setPerformances] = useState<PerformanceDto[]>([]);
  const [venues, setVenues] = useState<VenueDto[]>([]);
  const [initialLoading, setInitialLoading] = useState(true);
  const [editingPerformance, setEditingPerformance] = useState<PerformanceDto | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showCreateScheduleDialog, setShowScheduleCreateDialog] = useState(false);
  const [formData, setFormData] = useState<{
    title: string;
    description: string;
    theme: string;
    posterUrl: string;
    posterImage: File | null;
    startDate: string;
    endDate: string;
    runningTime: number;
    basePrice: number;
    venueId: number;
  }>({
    title: '',
    description: '',
    theme: '',
    posterUrl: '',
    posterImage: null,
    startDate: '',
    endDate: '',
    runningTime: 0,
    basePrice: 0,
    venueId: 0,
  });

  const [scheduleFormData, setScheduleFormData] = useState<{
    performance: PerformanceDto | null;
    showDatetime: string;
    status: string;
  }>({
    performance: null,
    showDatetime: '',
    status: '',
  });

  // 초기화
  useEffect(() => {
    const fetchPerfomances = async () => {
      try {
        setInitialLoading(true);

        const venueData = await venueService.getAllVenues();
        const performanceData = await adminPerformanceService.getPerformances();

        setVenues(venueData);
        setPerformances(performanceData);
      } catch (error) {
        console.error('공연 데이터를 가져오는데 실패했습니다: ', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchPerfomances();
  }, []);

  const handleCreatePerformance = async () => {
    try {
      const newPerformance = await adminPerformanceService.createPerformance(
        {
          venueId: formData.venueId,
          title: formData.title,
          description: formData.description,
          theme: formData.theme,
          posterUrl: '',
          basePrice: formData.basePrice,
          startDate: formData.startDate,
          endDate: formData.endDate,
          runningTime: formData.runningTime,
          status: 'UPCOMING',
          schedules: [],
        },
        formData.posterImage,
      );

      if (newPerformance !== undefined) {
        setPerformances((prev) => [...prev, newPerformance]);
        setShowCreateDialog(false);
        resetForm();
        console.log('공연 생성 성공');
      } else {
        throw new Error('공연 생성 실패');
      }
    } catch (error) {
      console.error('공연 생성 실패: ', error);
    }
  };

  const handleUpdatePerformance = async () => {
    if (!editingPerformance) return;

    try {
      const updateRequestBody: PerformanceRequest = {
        venueId: formData.venueId,
        title: formData.title,
        description: formData.description || '',
        theme: formData.theme,
        posterUrl: '',
        basePrice: formData.basePrice,
        startDate: formData.startDate,
        endDate: formData.endDate,
        runningTime: formData.runningTime,
        status: editingPerformance.status,
        schedules: [],
      };

      const updatedPerformance = await adminPerformanceService.updatePerformance(
        editingPerformance.performanceId,
        updateRequestBody,
        formData.posterImage,
      );

      if (updatedPerformance !== undefined) {
        setPerformances((prev) =>
          prev.map((perf) =>
            perf.performanceId === updatedPerformance.performanceId
              ? {
                  ...perf,
                  ...updatedPerformance,
                }
              : perf,
          ),
        );

        setEditingPerformance(null);
        resetForm();
        console.log('공연 수정 성공');
      } else {
        throw new Error('공연 수정 실패');
      }
    } catch (error) {
      console.error('공연 수정 실패: ', error);
    }
  };

  const handleDeletePerformance = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this performance?')) {
      return;
    }

    try {
      const success = await adminPerformanceService.deletePerformance(id);

      if (success) {
        setPerformances((prev) => prev.filter((perf) => perf.performanceId !== id));
        console.log('공연 삭제 성공');
      } else {
        throw new Error('공연 삭제 실패');
      }
    } catch (error) {
      console.error('공연 삭제 실패: ', error);
    }
  };

  const handleEditPerformance = (performance: PerformanceDto) => {
    setEditingPerformance(performance);
    setFormData({
      title: performance.title,
      description: performance.description || '',
      theme: performance.theme || '',
      posterUrl: performance.posterUrl || '',
      posterImage: null,
      startDate: performance.startDate || '',
      endDate: performance.endDate || '',
      runningTime: performance.runningTime || 0,
      basePrice: performance.basePrice || 0,
      venueId: performance.venueId || 0,
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      theme: '',
      posterUrl: '',
      posterImage: null,
      startDate: '',
      endDate: '',
      runningTime: 0,
      basePrice: 0,
      venueId: 0,
    });
  };

  const handleFormCancel = () => {
    setShowCreateDialog(false);
    setEditingPerformance(null);
    resetForm();
  };

  const handleCreateSchedule = async () => {
    if (!scheduleFormData.performance) return;

    try {
      const updateRequestBody: PerformanceRequest = {
        venueId: scheduleFormData.performance.venueId || 0,
        title: scheduleFormData.performance.title,
        description: scheduleFormData.performance.description || '',
        theme: scheduleFormData.performance.theme || '',
        posterUrl: '',
        basePrice: scheduleFormData.performance.basePrice || 0,
        startDate: scheduleFormData.performance.startDate || '',
        endDate: scheduleFormData.performance.endDate || '',
        runningTime: scheduleFormData.performance.runningTime || 0,
        status: scheduleFormData.performance.status || 'UPCOMING',
        schedules: [
          {
            showDatetime: scheduleFormData.showDatetime,
            status: scheduleFormData.status as any,
          },
        ],
      };

      console.log(scheduleFormData);

      const updatedPerformance = await adminPerformanceService.updatePerformance(
        scheduleFormData.performance.performanceId,
        updateRequestBody,
        formData.posterImage,
      );

      if (updatedPerformance !== undefined) {
        setShowScheduleCreateDialog(false);

        resetScheduleForm();
        console.log('스케줄 추가 성공');
      } else {
        throw new Error('스케줄 추가 실패');
      }
    } catch (error) {
      console.error('스케줄 추가 실패: ', error);
    }
  };

  const resetScheduleForm = () => {
    setScheduleFormData({
      performance: null,
      showDatetime: '',
      status: '',
    });
  };

  const handleScheduleFormCancel = () => {
    setShowScheduleCreateDialog(false);
    // setScheduleEditingPerformance(null);
    resetScheduleForm();
  };

  if (initialLoading) {
    return <PulseLoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Performance Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage performances, schedules, and venue assignments
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Performance
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Performance</DialogTitle>
            </DialogHeader>
            <PerformanceForm
              formData={formData}
              setFormData={setFormData}
              venues={venues}
              onSubmit={handleCreatePerformance}
              onCancel={handleFormCancel}
            />
          </DialogContent>
        </Dialog>
        <Dialog open={showCreateScheduleDialog} onOpenChange={setShowScheduleCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Schedule</DialogTitle>
            </DialogHeader>
            <ScheduleForm
              formData={scheduleFormData}
              setFormData={setScheduleFormData}
              performances={performances}
              onSubmit={handleCreateSchedule}
              onCancel={handleScheduleFormCancel}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          icon={Calendar}
          iconColor="text-blue-500"
          label="Total Performances"
          value={performances.length}
        />
        <StatCard
          icon={Users}
          iconColor="text-green-500"
          label="Total Bookings"
          value={performances.reduce((sum, p) => sum + (p.totalBookings || 0), 0).toLocaleString()}
        />
        <StatCard
          icon={MapPin}
          iconColor="text-purple-500"
          label="Active Venues"
          value={venues.length}
        />
        <StatCard
          icon={DollarSign}
          iconColor="text-yellow-500"
          label="Total Revenue"
          value={formatPrice(performances.reduce((sum, p) => sum + (p.revenue || 0), 0))}
        />
      </div>

      {/* Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Performances</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Venue</TableHead>
                <TableHead>Theme</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Revenue</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {performances.map((performance) => (
                <TableRow key={performance.performanceId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={performance.posterUrl}
                        alt={performance.title}
                        className="w-10 h-10 object-cover rounded"
                      />
                      <div>
                        <p className="font-medium">{performance.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {performance.runningTime}min
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{performance.venueName}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{performance.theme}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{formatDate(performance.startDate || '')}</div>
                      <div className="text-muted-foreground">
                        to {formatDate(performance.endDate || '')}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(performance.status || '')}>
                      {performance.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{(performance.totalBookings || 0).toLocaleString()}</TableCell>
                  <TableCell>{formatPrice(performance.revenue || 0)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditPerformance(performance)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePerformance(performance.performanceId)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingPerformance}
        onOpenChange={(open: any) => {
          if (!open) {
            setEditingPerformance(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Performance</DialogTitle>
          </DialogHeader>
          <PerformanceForm
            formData={formData}
            setFormData={setFormData}
            venues={venues}
            onSubmit={handleUpdatePerformance}
            onCancel={handleFormCancel}
            isEdit
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
