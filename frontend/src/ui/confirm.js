import Swal from 'sweetalert2';

// Native confirm()/alert() are never used (style guide §13) — everything goes
// through sweetalert2.
export async function confirmSignOut() {
  const { isConfirmed } = await Swal.fire({
    title: 'Sign out?',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sign out',
    confirmButtonColor: '#dc2626',
  });
  return isConfirmed;
}

export async function confirmDelete(label) {
  const { isConfirmed } = await Swal.fire({
    title: `Delete ${label}?`,
    text: 'This cannot be undone.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: 'Delete',
    confirmButtonColor: '#dc2626',
  });
  return isConfirmed;
}
