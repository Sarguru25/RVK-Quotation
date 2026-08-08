"use client";

import { useState, useEffect } from "react";
import {
  UserPlus,
  Search,
  Filter,
  Loader2,
  Edit,
  Trash2,
} from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    department: "General",
    isActive: true,
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchRoles();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");

      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoles = async () => {
    try {
      const res = await fetch("/api/roles");

      if (res.ok) {
        setRoles(await res.json());
      }
    } catch (error) {
      console.error("Failed to fetch roles", error);
    }
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);

      setFormData({
        name: user.name || "",
        email: user.email || "",
        password: "",
        roleId: user.role?._id || user.role || "",
        department: user.department || "General",
        isActive:
          user.isActive !== undefined
            ? user.isActive
            : true,
      });
    } else {
      setEditingUser(null);

      setFormData({
        name: "",
        email: "",
        password: "",
        roleId: roles[0]?._id || "",
        department: "General",
        isActive: true,
      });
    }

    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const url = editingUser
        ? `/api/users/${editingUser._id}`
        : "/api/users";

      const method = editingUser ? "PUT" : "POST";

      const payload = { ...formData };

      if (editingUser && !payload.password) {
        delete payload.password;
      }

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to save user");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to delete this user?"
      )
    )
      return;

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        fetchUsers();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to delete");
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2
          className="animate-spin text-indigo-600"
          size={32}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-5 md:px-6 py-4 sm:py-6 space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            User Management
          </h1>

          <p className="text-sm text-gray-500 mt-1">
            Manage system users, roles, and access
          </p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium shadow-sm"
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="p-3 sm:p-4 border-b border-gray-100 flex flex-col lg:flex-row gap-3 lg:gap-4 lg:items-center bg-gray-50/50">
          <div className="relative flex-1 w-full">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />

            <input
              type="text"
              placeholder="Search users..."
              className="w-full pl-9 pr-4 py-2.5 min-h-[42px] border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter size={16} />
            Filters
          </button>
        </div>

        <div className="overflow-x-auto min-h-[50vh]">
          <table className="min-w-[850px] w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500">
                <th className="px-3 sm:px-6 py-4 font-semibold">
                  User
                </th>

                <th className="px-3 sm:px-6 py-4 font-semibold">
                  Role
                </th>

                <th className="px-3 sm:px-6 py-4 font-semibold">
                  Department
                </th>

                <th className="px-3 sm:px-6 py-4 font-semibold">
                  Status
                </th>

                <th className="px-3 sm:px-6 py-4 font-semibold text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {users.map((user) => (
                <tr
                  key={user._id}
                  className="hover:bg-gray-50/50 transition-colors"
                >
                  <td className="px-3 sm:px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {user.name}
                        </div>

                        <div className="text-sm text-gray-500 truncate">
                          {user.email}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 sm:px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200 whitespace-nowrap">
                      {user.role?.name ||
                        user.roleString ||
                        "Unassigned"}
                    </span>
                  </td>

                  <td className="px-3 sm:px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                    {user.department}
                  </td>

                  <td className="px-3 sm:px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        user.isActive
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : "bg-red-50 text-red-700 border border-red-200"
                      }`}
                    >
                      {user.isActive
                        ? "Active"
                        : "Disabled"}
                    </span>
                  </td>

                  <td className="px-3 sm:px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 sm:gap-3">
                      <button
                        onClick={() =>
                          handleOpenModal(user)
                        }
                        className="p-2 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 transition-colors"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(user._id)
                        }
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {users.length === 0 && (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-10 text-center text-gray-500"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 my-auto">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                {editingUser
                  ? "Edit User"
                  : "Add User"}
              </h2>

              <button
                onClick={() =>
                  setIsModalOpen(false)
                }
                className="text-gray-400 hover:text-gray-600 focus:outline-none p-1"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-4 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>

                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>

                <input
                  required
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      email: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password{" "}
                  {editingUser && (
                    <span className="text-gray-400 font-normal text-xs sm:text-sm">
                      (Leave blank to keep current)
                    </span>
                  )}
                </label>

                <input
                  required={!editingUser}
                  type="password"
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      password: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2.5 min-h-[42px] border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role
                  </label>

                  <select
                    required
                    value={formData.roleId}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        roleId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 min-h-[42px] border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm bg-white"
                  >
                    <option value="" disabled>
                      Select Role
                    </option>

                    {roles.map((r) => (
                      <option
                        key={r._id}
                        value={r._id}
                      >
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>

                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2.5 min-h-[42px] border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isActive: e.target.checked,
                    })
                  }
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />

                <label
                  htmlFor="isActive"
                  className="text-sm text-gray-700"
                >
                  Account is Active
                </label>
              </div>

              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() =>
                    setIsModalOpen(false)
                  }
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-4 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center justify-center gap-2"
                >
                  {saving && (
                    <Loader2
                      size={14}
                      className="animate-spin"
                    />
                  )}

                  Save User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}