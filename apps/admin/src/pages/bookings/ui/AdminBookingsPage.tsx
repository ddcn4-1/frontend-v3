import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@packages/design-system';

import type { BookingDto } from '@packages/shared';
import type { User } from '@/entities/user';
import { bookingService } from '@packages/shared';
import { userService } from '@/entities/user';
import { formatDate, formatPrice, getStatusColor, getPaymentStatusColor } from '@/shared/lib';
import { StatCard, PulseLoadingSkeleton } from '@/shared/ui';

import { Search, Filter, Download, Eye, XCircle, CheckCircle } from 'lucide-react';

interface BookingManagementProps {
  permissions?: {
    canViewBookings: boolean;
  };
}

// Extend BookingDto with computed properties
interface EnrichedBooking extends BookingDto {
  payment_status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

// admin booking data transform util function
const transformAdminBookingData = (
  response: BookingDto,
  userMap: Map<number, User>,
): EnrichedBooking => {
  const user = userMap.get(response.userId);

  return {
    ...response,
    userName: user?.name || response.userName || 'Unknown User',
    userPhone: user?.phone || response.userPhone,
    payment_status: (response.status === 'CONFIRMED' ? 'COMPLETED' : 'FAILED') as
      | 'PENDING'
      | 'COMPLETED'
      | 'FAILED',
  };
};

export default function AdminBookingsPage({
  permissions = { canViewBookings: true },
}: Readonly<BookingManagementProps>) {
  const [bookings, setBookings] = useState<EnrichedBooking[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<EnrichedBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'CONFIRMED' | 'CANCELLED'>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [selectedBooking, setSelectedBooking] = useState<EnrichedBooking | null>(null);

  const searchBookings = async (searchParams?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<EnrichedBooking[]> => {
    try {
      const bookingsData = await bookingService.adminGetBookings({
        status: searchParams?.status === 'all' ? '' : searchParams?.status || '',
        page: searchParams?.page || 1,
        limit: searchParams?.limit || 20,
      });
      const userData = await userService.getUsers();
      const userMap = new Map(userData.map((u) => [u.userId, u]));

      // Convert Booking to EnrichedBooking by adding user data
      const enrichedBookings: EnrichedBooking[] = bookingsData.bookings.map((booking) =>
        transformAdminBookingData(booking, userMap),
      );

      return enrichedBookings;
    } catch (error) {
      console.error('Failed to search bookings: ', error);
      return [];
    }
  };

  const filterBookingsBySearchTerm = (
    bookings: EnrichedBooking[],
    searchTerm: string,
  ): EnrichedBooking[] => {
    if (!searchTerm) return bookings;

    return bookings.filter(
      (booking) =>
        booking.bookingNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.userName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (booking.performanceTitle || '').toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const enrichedBookings: EnrichedBooking[] = await searchBookings();

        setBookings(enrichedBookings);
        setFilteredBookings(enrichedBookings);
      } catch (error) {
        console.error('Failed to fetch bookings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  useEffect(() => {
    const handleBookingFilter = async () => {
      if (statusFilter !== 'all') {
        try {
          const serverFilteredBookings = await searchBookings({ status: statusFilter });

          const finalFilteredBookings = filterBookingsBySearchTerm(
            serverFilteredBookings,
            searchTerm,
          );

          setFilteredBookings(finalFilteredBookings);
        } catch (error) {
          console.error('Failed to filter bookings:', error);
          setFilteredBookings([]);
        }
        return;
      }

      const localFilteredBookings = filterBookingsBySearchTerm(bookings, searchTerm);
      setFilteredBookings(localFilteredBookings);
    };

    void handleBookingFilter();
  }, [bookings, searchTerm, statusFilter]);

  const handleCancelBooking = (bookingId: number) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      setBookings((prev) =>
        prev.map((booking) =>
          booking.bookingId === bookingId ? { ...booking, status: 'CANCELLED' as const } : booking,
        ),
      );
    }
  };

  const exportToCSV = () => {
    const csvData = filteredBookings.map((booking) => ({
      'Booking Number': booking.bookingNumber,
      'Customer Name': booking.userName,
      Email: booking.userPhone,
      Performance: booking.performanceTitle,
      Venue: booking.venueName,
      'Show Date': formatDate(booking.showDate),
      Seats: booking.seatCount,
      Amount: booking.totalAmount,
      Status: booking.status,
      Payment: booking.payment_status,
      'Booked At': formatDate(booking.bookedAt),
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map((row) => Object.values(row).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (!permissions.canViewBookings) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">
            Access denied. You don't have permission to view booking management.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <PulseLoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>Booking Management</h2>
          <p className="text-sm text-muted-foreground">
            Monitor and manage customer bookings and payments
          </p>
        </div>
        <Button onClick={exportToCSV} variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Booking Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={CheckCircle}
          iconColor="text-green-500"
          label="Confirmed"
          value={bookings.filter((b) => b.status === 'CONFIRMED').length}
        />
        <StatCard
          icon={XCircle}
          iconColor="text-red-500"
          label="Cancelled"
          value={bookings.filter((b) => b.status === 'CANCELLED').length}
        />
        <StatCard
          icon={CheckCircle}
          iconColor="text-blue-500"
          label="Total Revenue"
          value={formatPrice(
            bookings
              .filter((b) => b.status === 'CONFIRMED')
              .reduce((sum, b) => sum + (b.totalAmount || 0), 0),
          )}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search bookings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as 'all' | 'CONFIRMED' | 'CANCELLED')}
            >
              <SelectTrigger className="w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="CONFIRMED">Confirmed</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payments</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="FAILED">Failed</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredBookings.length} of {bookings.length} bookings
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bookings Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Performance</TableHead>
                <TableHead>Show Date</TableHead>
                <TableHead>Seats</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => (
                <TableRow key={booking.bookingId}>
                  <TableCell>
                    <div className="font-medium">{booking.bookingNumber}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(booking.bookedAt)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.userName}</div>
                    <div className="text-xs text-muted-foreground">{booking.userPhone}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.performanceTitle}</div>
                    <div className="text-xs text-muted-foreground">{booking.venueName}</div>
                  </TableCell>
                  <TableCell>{formatDate(booking.showDate)}</TableCell>
                  <TableCell>
                    <div className="font-medium">{booking.seatCount} seats</div>
                    <div className="text-xs text-muted-foreground">
                      {(booking.seats || []).map((s) => `${s.rowLabel}${s.colNum}`).join(', ')}
                    </div>
                  </TableCell>
                  <TableCell>{formatPrice(booking.totalAmount || 0)}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(booking.status || 'CONFIRMED')}>
                      {booking.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getPaymentStatusColor(booking.payment_status)}>
                      {booking.payment_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Booking Details</DialogTitle>
                          </DialogHeader>
                          {selectedBooking && (
                            <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <p className="text-sm text-muted-foreground">Booking Number</p>
                                  <p className="font-medium">{selectedBooking.bookingNumber}</p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Status</p>
                                  <Badge
                                    variant={getStatusColor(selectedBooking.status || 'CONFIRMED')}
                                  >
                                    {selectedBooking.status}
                                  </Badge>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Customer</p>
                                  <p className="font-medium">{selectedBooking.userName}</p>
                                  <p className="text-sm text-muted-foreground">
                                    {selectedBooking.userPhone}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-sm text-muted-foreground">Payment Status</p>
                                  <Badge
                                    variant={getPaymentStatusColor(selectedBooking.payment_status)}
                                  >
                                    {selectedBooking.payment_status}
                                  </Badge>
                                </div>
                              </div>

                              <div>
                                <p className="text-sm text-muted-foreground mb-2">Seat Details</p>
                                <div className="bg-muted rounded-lg p-3">
                                  {(selectedBooking.seats || []).map((seat, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                      <span>
                                        {seat.rowLabel}
                                        {seat.colNum} ({seat.grade})
                                      </span>
                                      <span>{formatPrice(seat.seatPrice || 0)}</span>
                                    </div>
                                  ))}
                                  <div className="border-t mt-2 pt-2 flex justify-between font-medium">
                                    <span>Total</span>
                                    <span>{formatPrice(selectedBooking.totalAmount || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </DialogContent>
                      </Dialog>

                      {booking.status !== 'CANCELLED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCancelBooking(booking.bookingId)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
