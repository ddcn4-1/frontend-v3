import React, { useState, useEffect } from 'react';
import {
  Card,
  CardHeader,
  CardContent,
  CardTitle,
  Button,
  Input,
  Label,
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
  Skeleton,
} from '@packages/design-system';

import { Plus, Edit, Trash2, Search, Shield, Users, UserCheck, AlertTriangle } from 'lucide-react';
import { userService } from '@/entities/user';
import type { User } from '@/entities/user';
import { formatDate, formatPrice, getStatusColor, getRoleColor } from '@/shared/lib';
import { StatCard, PulseLoadingSkeleton } from '@/shared/ui';

const UserForm = ({
  isEdit = false,
  formData,
  setFormData,
  handleCreateUser,
  handleUpdateUser,
  setShowCreateDialog,
  setEditingUser,
  resetForm,
}: {
  isEdit?: boolean;
  formData: any;
  setFormData: any;
  handleCreateUser: () => void;
  handleUpdateUser: () => void;
  setShowCreateDialog: (show: boolean) => void;
  setEditingUser: (user: any) => void;
  resetForm: () => void;
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email ?? ''}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
          placeholder="user@example.com"
        />
      </div>

      <div>
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          value={formData.username ?? ''}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, username: e.target.value }))}
          placeholder="username"
        />
      </div>
    </div>

    <div>
      <Label htmlFor="name">Full Name</Label>
      <Input
        id="name"
        value={formData.name ?? ''}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, name: e.target.value }))}
        placeholder="John Doe"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone ?? ''}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, phone: e.target.value }))}
          placeholder="010-1234-5678"
        />
      </div>

      <div>
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role ?? 'USER'}
          onValueChange={(value) => setFormData((prev: any) => ({ ...prev, role: value }))}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USER">User</SelectItem>
            <SelectItem value="DEV">Developer</SelectItem>
            <SelectItem value="DEVOPS">DevOps</SelectItem>
            <SelectItem value="ADMIN">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>

    <div>
      <Label htmlFor="password">
        {isEdit ? 'New Password (leave blank to keep current)' : 'Password'}
      </Label>
      <Input
        id="password"
        type="password"
        value={formData.password}
        onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
        placeholder={isEdit ? 'Leave blank to keep current password' : 'Enter password'}
      />
    </div>

    <div className="flex justify-end gap-2 pt-4">
      <Button
        variant="outline"
        onClick={() => {
          setShowCreateDialog(false);
          setEditingUser(null);
          resetForm();
        }}
      >
        Cancel
      </Button>
      <Button onClick={isEdit ? handleUpdateUser : handleCreateUser}>
        {isEdit ? 'Update' : 'Create'} User
      </Button>
    </div>
  </div>
);

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState<{
    email: string;
    username: string;
    name: string;
    phone: string;
    role: 'USER' | 'DEV' | 'DEVOPS' | 'ADMIN';
    password: string;
  }>({
    email: '',
    username: '',
    name: '',
    phone: '',
    role: 'USER',
    password: '',
  });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const userData = await userService.getUsers();

        setUsers(userData);
      } catch (error) {
        console.error('사용자 데이터를 가져오는데 실패했습니다:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const searchUsers = async (searchParams?: {
    username?: string;
    role?: string;
    status?: string;
  }) => {
    setLoading(true);

    try {
      const userData = await userService.searchUsers({
        username: searchParams?.username || '',
        role: searchParams?.role === 'all' ? '' : searchParams?.role || '',
        status: searchParams?.status === 'all' ? '' : searchParams?.status || '',
      });

      setFilteredUsers(userData);
      console.log(userData);
    } catch (error) {
      console.error('Failed to search users: ', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceTimer = setTimeout(() => {
      void searchUsers({
        username: searchTerm,
        role: roleFilter,
        status: statusFilter,
      });
    }, 500);

    return () => clearTimeout(delayDebounceTimer);
  }, [searchTerm]);

  useEffect(() => {
    void searchUsers({
      username: searchTerm,
      role: roleFilter,
      status: statusFilter,
    });
  }, [users, roleFilter, statusFilter]);

  const handleCreateUser = async () => {
    try {
      setLoading(true);

      const newUser = await userService.createUser({
        email: formData.email ?? '',
        username: formData.username ?? '',
        name: formData.name ?? '',
        phone: formData.phone ?? '',
        role: formData.role ?? 'USER',
        password: formData.password,
      });

      if (newUser !== undefined) {
        setUsers((prev) => [...prev, newUser]);
        setShowCreateDialog(false);
        resetForm();
        console.log('사용자 생성 성공');
      } else {
        throw new Error('사용자 생성 실패');
      }
    } catch (error) {
      console.error('사용자 생성 실패: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUser = () => {
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((user) => (user.userId === editingUser.userId ? { ...user, ...formData } : user)),
    );
    setEditingUser(null);
    resetForm();
  };

  const handleDeleteUser = async (id: number) => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      setLoading(true);

      const success = await userService.deleteUser(id);

      if (success) {
        setUsers((prev) => prev.filter((user) => user.userId !== id));
        console.log('사용자가 삭제 성공');
      } else {
        throw new Error('사용자 삭제 실패');
      }
    } catch (error) {
      console.error('사용자 삭제 실패: ', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email ?? '',
      username: user.username,
      name: user.name ?? '',
      phone: user.phone ?? '',
      role: user.role ?? 'USER',
      password: '',
    });
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      name: '',
      phone: '',
      role: 'USER',
      password: '',
    });
  };

  if (loading) {
    return <PulseLoadingSkeleton rows={5} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2>User Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage user accounts, roles, and permissions
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>
            <UserForm
              formData={formData}
              setFormData={setFormData}
              handleCreateUser={handleCreateUser}
              handleUpdateUser={handleUpdateUser}
              setShowCreateDialog={setShowCreateDialog}
              setEditingUser={setEditingUser}
              resetForm={resetForm}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* User Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={Users} iconColor="text-blue-500" label="Total Users" value={users.length} />
        <StatCard
          icon={UserCheck}
          iconColor="text-green-500"
          label="Active Users"
          value={users.filter((u) => u.status === 'ACTIVE').length}
        />
        <StatCard
          icon={Shield}
          iconColor="text-purple-500"
          label="Admin/Staff"
          value={users.filter((u) => u.role && ['ADMIN', 'DEVOPS', 'DEV'].includes(u.role)).length}
        />
        <StatCard
          icon={AlertTriangle}
          iconColor="text-red-500"
          label="Suspended"
          value={users.filter((u) => u.status === 'SUSPENDED').length}
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="USER">Users</SelectItem>
                <SelectItem value="DEV">Developers</SelectItem>
                <SelectItem value="DEVOPS">DevOps</SelectItem>
                <SelectItem value="ADMIN">Admins</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="INACTIVE">Inactive</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
              </SelectContent>
            </Select>

            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredUsers.length} of {users.length} users
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Bookings</TableHead>
                <TableHead>Total Spent</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.userId}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                      <div className="text-xs text-muted-foreground">{user.username}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getRoleColor(user.role ?? 'USER')}>{user.role ?? 'USER'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getStatusColor(user.status ?? 'INACTIVE')}>
                      {user.status ?? 'INACTIVE'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.lastLogin ? formatDate(user.lastLogin) : 'Never'}</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>{formatPrice(0)}</TableCell>
                  <TableCell>{user.createdAt ? formatDate(user.createdAt) : '-'}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteUser(user.userId)}
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
        open={!!editingUser}
        onOpenChange={(open) => {
          if (!open) {
            setEditingUser(null);
            resetForm();
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <UserForm
            isEdit
            formData={formData}
            setFormData={setFormData}
            handleCreateUser={handleCreateUser}
            handleUpdateUser={handleUpdateUser}
            setShowCreateDialog={setShowCreateDialog}
            setEditingUser={setEditingUser}
            resetForm={resetForm}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
