"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import Link from "next/link";
import axios from "axios";
import Image from "next/image";
import { Eye, Check, Trash2, Upload, ChevronRight, IdCard } from "lucide-react";
import useAuthStore from "@/store/authstore";
import { authAPI } from "@/utils/api";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phoneNo: z
    .string()
    .regex(/^[0-9+]+$/, "Only numbers allowed")
    .min(7, "Phone number too short"),
  email: z.string().email("Invalid email address"),
  address: z.string().min(10, "Address must be at least 10 characters"),
  bio: z.string().optional(),
  website: z.string().optional(),
});

export default function ContactPage() {
  const router = useRouter();

  const user = useAuthStore((s) => s.user);

  const [formData, setFormData] = useState({
    name: "",
    phoneNo: "",
    email: "",
    address: "",
    bio: "",
    website: "",
  });

  const [profileData, setProfileData] = useState({
  name: "",
  phoneNo: "",
  email: "",
  address: "",
  bio: "",
  website: "",
});

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasLoadedProfile, setHasLoadedProfile] = useState(false);

  useEffect(() => {
    if (hasLoadedProfile) return;

    useAuthStore.getState().hydrate();

    const loadProfile = async () => {
      try {
        // FIRST: use Zustand user
        if (user) {
          const userProfile = {
            name: user.name || "",
            phoneNo: user.phoneNo || user.phone || "",
            email: user.email || "",
            address: user.address || "",
            bio: user.bio || "",
            website: user.website || "",
          };

          setFormData(userProfile);
          setProfileData(userProfile);

          setHasLoadedProfile(true);
          return;
        }

        // SECOND: fetch authenticated user
        const token = localStorage.getItem("token");

        if (!token) {
          setHasLoadedProfile(true);
          return;
        }

        const data = await authAPI.getMe();

        if (data?.user) {
          const currentUser = {
            ...data.user,
            _id: data.user.id || data.user._id,
          };

          useAuthStore.getState().setUser(currentUser);

          setFormData({
            name: currentUser.name || "",
            phoneNo: currentUser.phoneNo || currentUser.phone || "",
            email: currentUser.email || "",
            address: currentUser.address || "",
            bio: currentUser.bio || "",
            website: currentUser.website || "",
          });
        }
      } catch (error) {
        console.log("Profile load error:", error);
      } finally {
        setHasLoadedProfile(true);
      }
    };

    loadProfile();
  }, [hasLoadedProfile, user]);

  useEffect(() => {
    if (!selectedPhoto) {
      setSelectedPhotoUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(selectedPhoto);
    setSelectedPhotoUrl(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedPhoto]);

  const handlePhotoButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedPhoto(file);
  };

  const handleRemovePhoto = () => {
    setSelectedPhoto(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error on typing
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSubmitting(true);
    setErrors({});
    setSuccessMessage("");

    try {
      // VALIDATION
      const result = contactSchema.safeParse(formData);

      if (!result.success) {
        const newErrors = {};

        result.error.issues.forEach((issue) => {
          const fieldName = issue.path[0];

          if (fieldName) {
            newErrors[fieldName] = issue.message;
          }
        });

        setErrors(newErrors);
        setIsSubmitting(false);
        return;
      }

      const payload = result.data;

      const token = localStorage.getItem("token");

      if (!token) {
        setErrors({
          form: "You must be logged in to save changes.",
        });

        setIsSubmitting(false);
        return;
      }

      // UPDATE USER PROFILE
      const response = await axios.put(
        "https://blog-backend-3p8r.onrender.com/api/contact/profile",
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // UPDATED USER FROM BACKEND
      const updatedUser = response.data.user;
      setProfileData(updatedUser);

      // UPDATE ZUSTAND STORE
      useAuthStore.getState().setUser(updatedUser);

      // OPTIONAL LOCAL STORAGE
      localStorage.setItem(
        "contactProfile",
        JSON.stringify(updatedUser)
      );

      setSuccessMessage("Profile updated successfully.");

      // REFRESH DASHBOARD DATA
      router.refresh();

      // REDIRECT
      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (error) {
      console.log(error);

      setErrors({
        form:
          error?.response?.data?.message ||
          "Something went wrong",
      });
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
      <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff] font-sans mx-auto max-w-2xl">
      <div className="overflow-hidden rounded-2xl border border-[#2a2740] bg-[#0d0d14]">

        {/* TOPBAR */}
        <div className="flex items-center justify-between border-b border-[#2a2740] bg-[#141420] px-5 py-3">

          <div className="flex items-center">
            <div className="text-[16px] font-semibold">
              Pulse<span className="text-[#7c6ff7]">.</span>
            </div>

            <div className="ml-3 flex items-center gap-1 text-xs text-[#9490b8]">
              <ChevronRight size={14} />
              <span>Profile</span>

              <ChevronRight size={14} />

              <span className="text-[#f0eeff]">
                Edit profile
              </span>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard">
              <button className="flex items-center gap-1 rounded-full border border-[#2a2740] px-4 py-1.5 text-sm text-[#9490b8] transition hover:text-white">
                <Eye size={14} />
                View profile
              </button>
            </Link>

            <button
              onClick={handleSubmit}
              type="button"
              disabled={isSubmitting}
              className="flex items-center gap-1 rounded-full bg-[#7c6ff7] px-4 py-1.5 text-sm font-semibold text-white"
            >
              <Check size={14} />

              {isSubmitting ? "Saving..." : "Save changes"}
            </button>
          </div>
        </div>

        <div className="flex min-h-112.5">

          {/* MAIN */}
          <main className="flex-1 overflow-y-auto px-9 py-8">

            {/* HEADER */}
            <div className="mb-7">
              <h1 className="mb-1 text-2xl font-semibold">
                General info
              </h1>

              <p className="text-sm text-[#9490b8]">
                Update your public profile details and appearance.
              </p>
            </div>

            {/* FORM ERROR */}
            {errors.form && (
              <div className="mb-5 rounded-xl border border-[#7c6ff7]/20 bg-[#2f1826] px-4 py-3 text-sm text-[#f09595]">
                {errors.form}
              </div>
            )}

            {/* SUCCESS */}
            {successMessage && (
              <div className="mb-5 rounded-xl border border-[#7c6ff7]/20 bg-[#122b17] px-4 py-3 text-sm text-[#8df0a4]">
                {successMessage}
              </div>
            )}

            {/* AVATAR */}
            <div className="mb-6 flex items-center gap-5 rounded-xl border border-[#2a2740] bg-[#141420] p-5">

              <div className="relative flex h-18 w-18 cursor-pointer items-center justify-center overflow-hidden rounded-full border-[2.5px] border-[#7c6ff7] bg-[#2e2a5c] text-2xl font-semibold text-[#a89cf7]">
                {selectedPhotoUrl ? (
                  <Image
                    src={selectedPhotoUrl}
                    alt="Profile photo"
                    fill
                    className="object-cover"
                    unoptimized
                  />
                ) : (
                  profileData.name?.trim()?.charAt(0)?.toUpperCase() || "U"
                )}
              </div>

              <div className="flex-1">
                <div className="mb-1 text-[15px] font-semibold">
                  {profileData.name || "Your name"}
                </div>

                <div className="mb-3 text-sm text-[#9490b8]">
                  {profileData.email
                    ? `@${profileData.email.split("@")[0]}`
                    : "@user"}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePhotoButtonClick}
                    className="flex items-center gap-1 rounded-full bg-[#7c6ff7] px-4 py-1.5 text-sm text-white"
                  >
                    <Upload size={14} />
                    Upload photo
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="flex items-center gap-1 rounded-full border border-[#2a2740] px-4 py-1.5 text-sm text-[#9490b8] transition hover:border-[#f09595] hover:text-[#f09595]"
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                </div>

                {selectedPhoto && (
                  <div className="mt-3 text-sm text-[#9490b8]">
                    Selected file: {selectedPhoto.name}
                  </div>
                )}
              </div>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit}>

              <SectionTitle
                icon={<IdCard size={15} />}
                title="Basic details"
              />

              <div className="mb-8 grid grid-cols-2 gap-4">

                {/* NAME */}
                <Field label="Display name">
                  <Input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Your display name"
                  />

                  {errors.name && (
                    <p className="mt-2 text-xs text-[#f09595]">
                      {errors.name}
                    </p>
                  )}
                </Field>

                {/* PHONE */}
                <Field label="Phone Number">

                  <div className="flex overflow-hidden rounded-lg border border-[#2a2740] bg-[#1c1c2e]">

                    <span className="border-r border-[#2a2740] px-3 py-2 text-sm text-[#9490b8]">
                      Phone
                    </span>

                    <input
                      className="flex-1 bg-transparent px-3 py-2 text-sm outline-none"
                      name="phoneNo"
                      type="tel"
                      value={formData.phoneNo}
                      onChange={handleChange}
                      placeholder="+234..."
                    />
                  </div>

                  {errors.phoneNo && (
                    <p className="mt-2 text-xs text-[#f09595]">
                      {errors.phoneNo}
                    </p>
                  )}
                </Field>

                {/* BIO */}
                <div className="col-span-2">
                  <Field label="Bio">

                    <textarea
                      rows={3}
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full resize-none rounded-lg border border-[#2a2740] bg-[#1c1c2e] px-3 py-2 text-sm outline-none focus:border-[#7c6ff7]"
                      placeholder="A short bio"
                    />

                  </Field>
                </div>

                {/* EMAIL */}
                <Field label="Email">
                  <Input
                    name="email"
                    type="email"
                    value={formData.email}
                    readOnly
                    placeholder="you@example.com"
                  />

                  {errors.email && (
                    <p className="mt-2 text-xs text-[#f09595]">
                      {errors.email}
                    </p>
                  )}
                </Field>

                {/* ADDRESS */}
                <Field label="Address">
                  <Input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Lagos, Nigeria"
                  />

                  {errors.address && (
                    <p className="mt-2 text-xs text-[#f09595]">
                      {errors.address}
                    </p>
                  )}
                </Field>

                {/* WEBSITE */}
                <Field label="Website">
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yoursite.com"
                  />
                </Field>

              </div>
            </form>
          </main>
        </div>

        {/* FOOTER */}
        <div className="flex items-center justify-between border-t border-[#2a2740] bg-[#141420] px-5 py-4">

          <Link href="/dashboard">
            <button className="rounded-full border border-[#2a2740] px-5 py-2 text-sm text-[#9490b8] transition hover:text-white">
              Cancel
            </button>
          </Link>

          <button
            onClick={handleSubmit}
            type="button"
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-full bg-[#7c6ff7] px-5 py-2 text-sm font-semibold text-white"
          >
            <Check size={15} />

            {isSubmitting ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>
    </div>

    
  );
}

/* COMPONENTS */

function SectionTitle({ icon, title }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-[#2a2740] pb-2 text-xs font-medium uppercase tracking-wide text-[#9490b8]">
      {icon}
      {title}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="mb-1 text-xs text-[#9490b8]">{label}</div>
      {children}
    </div>
  );
}

function Input(props) {
  return (
    <input
      {...props}
      className="w-full rounded-lg border border-[#2a2740] bg-[#1c1c2e] px-3 py-2 text-sm outline-none focus:border-[#7c6ff7]"
    />
  );
}
