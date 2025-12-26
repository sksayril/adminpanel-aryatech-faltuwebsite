import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { contactsApi, Contact, UpdateContactStatusData, AddNoteData } from '@/api/contacts.api';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Switch } from '@/components/ui/Switch';
import { SkeletonTable, SkeletonStats, Skeleton } from '@/components/ui/Skeleton';
import { showToast } from '@/utils/toast';
import {
  TrashIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  BuildingOfficeIcon,
  EyeIcon,
  ChatBubbleLeftRightIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArchiveBoxIcon,
} from '@heroicons/react/24/outline';

const updateStatusSchema = z.object({
  Status: z.enum(['new', 'contacted', 'replied', 'resolved', 'archived']).optional(),
  IsReachedOut: z.boolean().optional(),
  Notes: z.string().optional(),
  Priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

const addNoteSchema = z.object({
  Note: z.string().min(1, 'Note is required'),
});

type UpdateStatusFormData = z.infer<typeof updateStatusSchema>;
type AddNoteFormData = z.infer<typeof addNoteSchema>;

const getStatusColor = (status?: string) => {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800';
    case 'replied':
      return 'bg-green-100 text-green-800';
    case 'resolved':
      return 'bg-gray-100 text-gray-800';
    case 'archived':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-800';
    case 'medium':
      return 'bg-blue-100 text-blue-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'urgent':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export const SponsorContact = () => {
  const queryClient = useQueryClient();
  const { isSubAdmin, hasPermission } = useAuth();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [isReachedOutFilter, setIsReachedOutFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; contactId: string | null }>({
    isOpen: false,
    contactId: null,
  });

  // Permission checks
  const canUpdateContact = !isSubAdmin || hasPermission('contact:update');
  const canDeleteContact = !isSubAdmin || hasPermission('contact:delete');

  // Build query params
  const queryParams: any = { page, limit: 20 };
  if (searchQuery) queryParams.search = searchQuery;
  if (statusFilter) queryParams.status = statusFilter;
  if (typeFilter) queryParams.type = typeFilter;
  if (isReachedOutFilter) queryParams.isReachedOut = isReachedOutFilter === 'true';
  if (priorityFilter) queryParams.priority = priorityFilter;

  // Fetch contacts
  const { data, isLoading } = useQuery({
    queryKey: ['contacts', queryParams],
    queryFn: () => contactsApi.getAll(queryParams),
  });

  // Fetch statistics
  const { data: statsData, isLoading: isLoadingStats } = useQuery({
    queryKey: ['contacts-stats'],
    queryFn: () => contactsApi.getStats(),
  });

  // Fetch contact details
  const { data: contactDetails } = useQuery({
    queryKey: ['contact', selectedContact?._id],
    queryFn: () => contactsApi.getById(selectedContact!._id),
    enabled: !!selectedContact?._id && isDetailsModalOpen,
  });

  // Status update form
  const {
    register: registerStatus,
    handleSubmit: handleSubmitStatus,
    formState: { errors: statusErrors },
    reset: resetStatus,
    setValue: setStatusValue,
    watch: watchStatus,
  } = useForm<UpdateStatusFormData>({
    resolver: zodResolver(updateStatusSchema),
  });

  // Note form
  const {
    register: registerNote,
    handleSubmit: handleSubmitNote,
    formState: { errors: noteErrors },
    reset: resetNote,
  } = useForm<AddNoteFormData>({
    resolver: zodResolver(addNoteSchema),
  });

  // Load contact data into status form
  useEffect(() => {
    if (selectedContact && isStatusModalOpen) {
      setStatusValue('Status', selectedContact.Status);
      setStatusValue('IsReachedOut', selectedContact.IsReachedOut || false);
      setStatusValue('Notes', selectedContact.Notes || '');
      setStatusValue('Priority', selectedContact.Priority);
    }
  }, [selectedContact, isStatusModalOpen, setStatusValue]);

  // Mutations
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateContactStatusData }) =>
      contactsApi.updateStatus(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-stats'] });
      queryClient.invalidateQueries({ queryKey: ['contact', selectedContact?._id] });
      setIsStatusModalOpen(false);
      resetStatus();
      showToast.success('Contact status updated successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to update contact status');
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: AddNoteData }) => contactsApi.addNote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contact', selectedContact?._id] });
      setIsNoteModalOpen(false);
      resetNote();
      showToast.success('Note added successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to add note');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts-stats'] });
      setDeleteModal({ isOpen: false, contactId: null });
      showToast.success('Contact deleted successfully');
    },
    onError: (error: any) => {
      showToast.error(error?.response?.data?.message || 'Failed to delete contact');
    },
  });

  // Handlers
  const handleUpdateStatus = (data: UpdateStatusFormData) => {
    if (!selectedContact) return;
    if (!canUpdateContact) {
      showToast.error('You do not have permission to update contacts. Please contact the administrator.');
      return;
    }
    updateStatusMutation.mutate({
      id: selectedContact._id,
      data: {
        Status: data.Status,
        IsReachedOut: data.IsReachedOut,
        Notes: data.Notes,
        Priority: data.Priority,
      },
    });
  };

  const handleAddNote = (data: AddNoteFormData) => {
    if (!selectedContact) return;
    if (!canUpdateContact) {
      showToast.error('You do not have permission to update contacts. Please contact the administrator.');
      return;
    }
    addNoteMutation.mutate({
      id: selectedContact._id,
      data: { Note: data.Note },
    });
  };

  const handleDelete = () => {
    if (deleteModal.contactId) {
      if (!canDeleteContact) {
        showToast.error('You do not have permission to delete contacts. Please contact the administrator.');
        setDeleteModal({ isOpen: false, contactId: null });
        return;
      }
      deleteMutation.mutate(deleteModal.contactId);
    }
  };

  const handleViewDetails = (contact: Contact) => {
    setSelectedContact(contact);
    setIsDetailsModalOpen(true);
  };

  const handleUpdateStatusClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsStatusModalOpen(true);
  };

  const handleAddNoteClick = (contact: Contact) => {
    setSelectedContact(contact);
    setIsNoteModalOpen(true);
  };

  const contacts = data?.data || [];
  const pagination = data?.pagination;
  const stats = statsData;

  if (isLoading || isLoadingStats) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton variant="text" height={32} width={200} />
            <Skeleton variant="text" height={20} width={300} className="mt-2" />
          </div>
        </div>
        <SkeletonStats />
        <SkeletonTable />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sponsor Contact</h1>
          <p className="text-gray-600">Manage sponsor contact information and inquiries</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Contacts</p>
                <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              </div>
              <PhoneIcon className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">New</p>
                <p className="text-2xl font-bold text-yellow-900">{stats.new}</p>
              </div>
              <ClockIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Reached Out</p>
                <p className="text-2xl font-bold text-green-900">{stats.reachedOut}</p>
              </div>
              <CheckCircleIcon className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="card bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Resolved</p>
                <p className="text-2xl font-bold text-purple-900">{stats.resolved}</p>
              </div>
              <ArchiveBoxIcon className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="relative lg:col-span-2">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="pl-10"
            />
          </div>
          <Select
            label="Status"
            options={[
              { value: '', label: 'All Status' },
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'replied', label: 'Replied' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'archived', label: 'Archived' },
            ]}
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Type"
            options={[
              { value: '', label: 'All Types' },
              { value: 'sponsor', label: 'Sponsor' },
              { value: 'general', label: 'General' },
              { value: 'support', label: 'Support' },
              { value: 'partnership', label: 'Partnership' },
            ]}
            value={typeFilter}
            onChange={(e) => {
              setTypeFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Reached Out"
            options={[
              { value: '', label: 'All' },
              { value: 'true', label: 'Yes' },
              { value: 'false', label: 'No' },
            ]}
            value={isReachedOutFilter}
            onChange={(e) => {
              setIsReachedOutFilter(e.target.value);
              setPage(1);
            }}
          />
          <Select
            label="Priority"
            options={[
              { value: '', label: 'All Priority' },
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-cyan-50 to-blue-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Company
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Reached Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {contacts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center">
                      <PhoneIcon className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-lg font-medium text-gray-900 mb-2">No contacts found</p>
                      <p className="text-sm text-gray-500">Try adjusting your filters</p>
                    </div>
                  </td>
                </tr>
              ) : (
                contacts.map((contact) => (
                  <tr key={contact._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{contact.Name}</div>
                      {contact.Phone && (
                        <div className="text-sm text-gray-500 flex items-center mt-1">
                          <PhoneIcon className="h-3 w-3 mr-1" />
                          {contact.Phone}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <EnvelopeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.Email}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <BuildingOfficeIcon className="h-4 w-4 mr-2 text-gray-400" />
                        {contact.Company || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                        {contact.Type || 'general'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          contact.Status
                        )} capitalize`}
                      >
                        {contact.Status || 'new'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.Priority && (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                            contact.Priority
                          )} capitalize`}
                        >
                          {contact.Priority}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {contact.IsReachedOut ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleViewDetails(contact)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="View Details"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {canUpdateContact && (
                          <>
                            <button
                              onClick={() => handleUpdateStatusClick(contact)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Update Status"
                            >
                              <CheckCircleIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleAddNoteClick(contact)}
                              className="text-purple-600 hover:text-purple-900"
                              title="Add Note"
                            >
                              <ChatBubbleLeftRightIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                        {canDeleteContact && (
                          <button
                            onClick={() => setDeleteModal({ isOpen: true, contactId: contact._id })}
                            className="text-red-600 hover:text-red-900"
                            title="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing {((pagination.page - 1) * pagination.limit + 1).toLocaleString()} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total).toLocaleString()} of{' '}
              {pagination.total.toLocaleString()} contacts
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page === 1}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                disabled={pagination.page === pagination.pages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Contact Details Modal */}
      <Modal
        isOpen={isDetailsModalOpen}
        onClose={() => {
          setIsDetailsModalOpen(false);
          setSelectedContact(null);
        }}
        title="Contact Details"
        size="2xl"
      >
        {contactDetails ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <p className="text-sm text-gray-900">{contactDetails.Name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <p className="text-sm text-gray-900">{contactDetails.Email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <p className="text-sm text-gray-900">{contactDetails.Phone || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <p className="text-sm text-gray-900">{contactDetails.Company || '-'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 capitalize">
                  {contactDetails.Type || 'general'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                    contactDetails.Status
                  )} capitalize`}
                >
                  {contactDetails.Status || 'new'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                {contactDetails.Priority ? (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(
                      contactDetails.Priority
                    )} capitalize`}
                  >
                    {contactDetails.Priority}
                  </span>
                ) : (
                  <p className="text-sm text-gray-500">-</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reached Out</label>
                <p className="text-sm text-gray-900">
                  {contactDetails.IsReachedOut ? 'Yes' : 'No'}
                  {contactDetails.ReachedOutAt && (
                    <span className="text-gray-500 ml-2">
                      ({new Date(contactDetails.ReachedOutAt).toLocaleDateString()})
                    </span>
                  )}
                </p>
              </div>
            </div>
            {contactDetails.Subject && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <p className="text-sm text-gray-900">{contactDetails.Subject}</p>
              </div>
            )}
            {contactDetails.Message && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{contactDetails.Message}</p>
              </div>
            )}
            {contactDetails.Notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{contactDetails.Notes}</p>
              </div>
            )}
            {contactDetails.AdminNotes && contactDetails.AdminNotes.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Admin Notes</label>
                <div className="space-y-3">
                  {contactDetails.AdminNotes.map((note) => (
                    <div key={note._id} className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm text-gray-900">{note.Note}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                        <span>By: {note.CreatedBy.Name}</span>
                        <span>{new Date(note.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                variant="outline"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setSelectedContact(null);
                }}
              >
                Close
              </Button>
              {canUpdateContact && (
                <Button onClick={() => handleUpdateStatusClick(contactDetails)}>
                  Update Status
                </Button>
              )}
            </div>
          </div>
        ) : (
          <Skeleton variant="rect" height={400} />
        )}
      </Modal>

      {/* Update Status Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => {
          setIsStatusModalOpen(false);
          setSelectedContact(null);
        }}
        title="Update Contact Status"
        size="xl"
      >
        <form onSubmit={handleSubmitStatus(handleUpdateStatus)} className="space-y-6">
          <Select
            label="Status"
            options={[
              { value: 'new', label: 'New' },
              { value: 'contacted', label: 'Contacted' },
              { value: 'replied', label: 'Replied' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'archived', label: 'Archived' },
            ]}
            {...registerStatus('Status')}
            error={statusErrors.Status?.message}
          />
          <Select
            label="Priority"
            options={[
              { value: 'low', label: 'Low' },
              { value: 'medium', label: 'Medium' },
              { value: 'high', label: 'High' },
              { value: 'urgent', label: 'Urgent' },
            ]}
            {...registerStatus('Priority')}
            error={statusErrors.Priority?.message}
          />
          <div className="flex items-center gap-2">
            <Switch
              checked={watchStatus('IsReachedOut') || false}
              onChange={(checked) => setStatusValue('IsReachedOut', checked)}
            />
            <label className="text-sm font-medium text-gray-700">Mark as Reached Out</label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
            <textarea
              {...registerStatus('Notes')}
              rows={4}
              className="input w-full"
              placeholder="Add notes about this contact..."
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsStatusModalOpen(false);
                setSelectedContact(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={updateStatusMutation.isPending}>
              Update Status
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Note Modal */}
      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => {
          setIsNoteModalOpen(false);
          setSelectedContact(null);
        }}
        title="Add Admin Note"
        size="lg"
      >
        <form onSubmit={handleSubmitNote(handleAddNote)} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
            <textarea
              {...registerNote('Note')}
              rows={4}
              className={`input w-full ${noteErrors.Note ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
              placeholder="Enter your note here..."
            />
            {noteErrors.Note && (
              <p className="mt-1 text-sm text-red-600">{noteErrors.Note.message}</p>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsNoteModalOpen(false);
                setSelectedContact(null);
              }}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={addNoteMutation.isPending}>
              Add Note
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, contactId: null })}
        title="Delete Contact"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Are you sure you want to delete this contact? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ isOpen: false, contactId: null })}
            >
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={deleteMutation.isPending}>
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
