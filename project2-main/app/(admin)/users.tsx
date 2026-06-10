import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Filter, GraduationCap, UserCog, ChevronRight, MoreVertical, X, Shield, User, Users } from 'lucide-react-native';
import { COLORS } from '@/constants/colors';
import { getStudents, getFaculty, getUsers, updateUserRole } from '@/services/userService';
import { Profile } from '@/types/database';
import LoadingSpinner from '@/components/LoadingSpinner';

interface UserData {
  id: string;
  name: string;
  email: string;
  enrollment: string;
  department: string;
  role: 'student' | 'faculty' | 'admin';
  points: number;
}

export default function AdminUsers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState<'students' | 'faculty' | 'all'>('all');
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);

  const fetchUsers = useCallback(async () => {
    try {
      let result;
      if (selectedTab === 'students') {
        result = await getStudents();
      } else if (selectedTab === 'faculty') {
        result = await getFaculty();
      } else {
        result = await getUsers();
      }
      
      if (result.data) {
        const userData: UserData[] = result.data.map((profile: Profile) => ({
          id: profile.id,
          name: profile.full_name || 'Unknown',
          email: profile.email,
          enrollment: profile.enrollment_number || 'N/A',
          department: profile.department || 'Not Assigned',
          role: profile.role || 'student',
          points: 0,
        }));
        setUsers(userData);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTab]);

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [fetchUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleRoleChange = async (newRole: 'student' | 'faculty' | 'admin') => {
    if (!selectedUser) return;
    
    setUpdatingRole(true);
    const result = await updateUserRole(selectedUser.id, newRole);
    setUpdatingRole(false);
    
    if (result.success) {
      // Update local state
      setUsers(prev => prev.map(u => 
        u.id === selectedUser.id ? { ...u, role: newRole } : u
      ));
      setShowRoleModal(false);
      setSelectedUser(null);
      Alert.alert('Success', `User role updated to ${newRole}`);
    } else {
      Alert.alert('Error', result.error || 'Failed to update role');
    }
  };

  const openRoleModal = (user: UserData) => {
    setSelectedUser(user);
    setShowRoleModal(true);
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.enrollment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return COLORS.error;
      case 'faculty': return COLORS.secondary;
      default: return COLORS.primary;
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield size={14} color={COLORS.white} />;
      case 'faculty': return <UserCog size={14} color={COLORS.white} />;
      default: return <User size={14} color={COLORS.white} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users</Text>
        <Text style={styles.headerSubtitle}>Manage user roles and access</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor={COLORS.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'all' && styles.tabActive]}
          onPress={() => setSelectedTab('all')}
        >
          <Users size={18} color={selectedTab === 'all' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, selectedTab === 'all' && styles.tabTextActive]}>
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'students' && styles.tabActive]}
          onPress={() => setSelectedTab('students')}
        >
          <GraduationCap size={18} color={selectedTab === 'students' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, selectedTab === 'students' && styles.tabTextActive]}>
            Students
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'faculty' && styles.tabActive]}
          onPress={() => setSelectedTab('faculty')}
        >
          <UserCog size={18} color={selectedTab === 'faculty' ? COLORS.primary : COLORS.textMuted} />
          <Text style={[styles.tabText, selectedTab === 'faculty' && styles.tabTextActive]}>
            Faculty
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <LoadingSpinner />
          </View>
        ) : (
          <View style={styles.usersList}>
            {filteredUsers.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No users found</Text>
              </View>
            ) : filteredUsers.map((user, index) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  index === filteredUsers.length - 1 && styles.lastUserCard
                ]}
                onPress={() => openRoleModal(user)}
              >
                <View style={[styles.userAvatar, { backgroundColor: getRoleColor(user.role) + '15' }]}>
                  <Text style={[styles.avatarText, { color: getRoleColor(user.role) }]}>
                    {user.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.userName}>{user.name}</Text>
                  <Text style={styles.userMeta}>{user.email}</Text>
                  <Text style={styles.userDept}>{user.department}</Text>
                </View>
                <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                  {getRoleIcon(user.role)}
                  <Text style={styles.roleText}>{user.role}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Role Change Modal */}
      <Modal
        visible={showRoleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change User Role</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>
            
            {selectedUser && (
              <View style={styles.modalUserInfo}>
                <Text style={styles.modalUserName}>{selectedUser.name}</Text>
                <Text style={styles.modalUserEmail}>{selectedUser.email}</Text>
                <Text style={styles.modalCurrentRole}>
                  Current Role: <Text style={{ color: getRoleColor(selectedUser.role), fontWeight: '600' }}>{selectedUser.role}</Text>
                </Text>
              </View>
            )}

            <Text style={styles.selectRoleLabel}>Select New Role:</Text>
            
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[styles.roleOption, selectedUser?.role === 'student' && styles.roleOptionDisabled]}
                onPress={() => handleRoleChange('student')}
                disabled={updatingRole || selectedUser?.role === 'student'}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: COLORS.primary }]}>
                  <User size={20} color={COLORS.white} />
                </View>
                <View style={styles.roleOptionInfo}>
                  <Text style={styles.roleOptionTitle}>Student</Text>
                  <Text style={styles.roleOptionDesc}>Can submit activities and view portfolio</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, selectedUser?.role === 'faculty' && styles.roleOptionDisabled]}
                onPress={() => handleRoleChange('faculty')}
                disabled={updatingRole || selectedUser?.role === 'faculty'}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: COLORS.secondary }]}>
                  <UserCog size={20} color={COLORS.white} />
                </View>
                <View style={styles.roleOptionInfo}>
                  <Text style={styles.roleOptionTitle}>Faculty</Text>
                  <Text style={styles.roleOptionDesc}>Can review and approve activities</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.roleOption, selectedUser?.role === 'admin' && styles.roleOptionDisabled]}
                onPress={() => handleRoleChange('admin')}
                disabled={updatingRole || selectedUser?.role === 'admin'}
              >
                <View style={[styles.roleOptionIcon, { backgroundColor: COLORS.error }]}>
                  <Shield size={20} color={COLORS.white} />
                </View>
                <View style={styles.roleOptionInfo}>
                  <Text style={styles.roleOptionTitle}>Admin</Text>
                  <Text style={styles.roleOptionDesc}>Full system access and management</Text>
                </View>
              </TouchableOpacity>
            </View>

            {updatingRole && (
              <View style={styles.updatingIndicator}>
                <LoadingSpinner />
                <Text style={styles.updatingText}>Updating role...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 48,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 16,
    gap: 12,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  tabActive: {
    backgroundColor: COLORS.primary + '10',
    borderColor: COLORS.primary,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
  },
  usersList: {
    marginHorizontal: 24,
    backgroundColor: COLORS.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  lastUserCard: {
    borderBottomWidth: 0,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 2,
  },
  userMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  userDept: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  userStats: {
    alignItems: 'flex-end',
    marginRight: 8,
  },
  userStatValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textTransform: 'capitalize',
  },
  moreButton: {
    padding: 4,
  },
  bottomPadding: {
    height: 100,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  modalUserInfo: {
    backgroundColor: COLORS.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  modalUserEmail: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalCurrentRole: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  selectRoleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
  },
  roleOptions: {
    gap: 12,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionDisabled: {
    opacity: 0.5,
  },
  roleOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  roleOptionDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  updatingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 12,
  },
  updatingText: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
});
