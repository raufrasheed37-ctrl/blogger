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
  name: z.string().trim().min(1, "Enter your name"),
  phoneNo: z
    .string()
    .trim()
    .refine(
      (value) =>
        value === "" || /^\+[0-9]{1,14}$/.test(value),
      {
        message:
          "Number must not be longer than 15 characters and it must start with +",
      }
    ).optional(),
  email: z.string().email("Invalid email address"),
  address: z.string().trim()
    .refine(
      (value) =>
        value === "" || value.length >= 10,
      {
        message: "Address must be at least 10 characters",
      }
    )
    .optional(),
  bio: z.string().max(160, "Bio must be 160 characters or fewer").optional(),
  website: z.string().optional(),
occupation: z.string().optional(),
company: z.string().optional(),

socialLinks: z.object({
  twitter: z.string().url().optional().or(z.literal("")),
instagram: z.string().url().optional().or(z.literal("")),
facebook: z.string().url().optional().or(z.literal("")),
linkedin: z.string().url().optional().or(z.literal("")),
github: z.string().url().optional().or(z.literal("")),
youtube: z.string().url().optional().or(z.literal("")),
}).default({}),

privacy: z.object({
  phoneNo: z.enum([
    "only_me",
    "mutuals",
    "subscribers",
    "everyone",
  ]),

  email: z.enum([
    "only_me",
    "mutuals",
    "subscribers",
    "everyone",
  ]),

  address: z.enum([
    "only_me",
    "mutuals",
    "subscribers",
    "everyone",
  ]),

  website: z.enum([
    "only_me",
    "mutuals",
    "subscribers",
    "everyone",
  ]),

  followersList: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

subscriptionsList: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

  bio: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

occupation: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

company: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

twitter: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

instagram: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

facebook: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

linkedin: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

github: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),

youtube: z.enum([
  "only_me",
  "mutuals",
  "subscribers",
  "everyone",
]),
  
}).default({
  phoneNo: "only_me",
  email: "only_me",
  address: "subscribers",
  website: "everyone",
  followersList: "everyone",
  subscriptionsList: "everyone",
  bio: "everyone",
occupation: "everyone",
company: "everyone",

twitter: "everyone",
instagram: "everyone",
facebook: "everyone",
linkedin: "everyone",
github: "everyone",
youtube: "everyone",
}),
  
});

const nigeriaStates = [
  "Abia, Nigeria",
  "Adamawa, Nigeria",
  "Akwa Ibom, Nigeria",
  "Anambra, Nigeria",
  "Bauchi, Nigeria",
  "Bayelsa, Nigeria",
  "Benue, Nigeria",
  "Borno, Nigeria",
  "Cross River, Nigeria",
  "Delta, Nigeria",
  "Ebonyi, Nigeria",
  "Edo, Nigeria",
  "Ekiti, Nigeria",
  "Enugu, Nigeria",
  "FCT Abuja, Nigeria",
  "Gombe, Nigeria",
  "Imo, Nigeria",
  "Jigawa, Nigeria",
  "Kaduna, Nigeria",
  "Kano, Nigeria",
  "Katsina, Nigeria",
  "Kebbi, Nigeria",
  "Kogi, Nigeria",
  "Kwara, Nigeria",
  "Lagos, Nigeria",
  "Nasarawa, Nigeria",
  "Niger, Nigeria",
  "Ogun, Nigeria",
  "Ondo, Nigeria",
  "Osun, Nigeria",
  "Oyo, Nigeria",
  "Plateau, Nigeria",
  "Rivers, Nigeria",
  "Sokoto, Nigeria",
  "Taraba, Nigeria",
  "Yobe, Nigeria",
  "Zamfara, Nigeria",
];

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

  occupation: "",
  company: "",

  socialLinks: {
    twitter: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    github: "",
    youtube: "",
  },

  privacy: {
    phoneNo: "only_me",
    email: "only_me",
    address: "subscribers",
    website: "everyone",
    followersList: "everyone",
    subscriptionsList: "everyone",
    bio: "everyone",
occupation: "everyone",
company: "everyone",

twitter: "everyone",
instagram: "everyone",
facebook: "everyone",
linkedin: "everyone",
github: "everyone",
youtube: "everyone",
  },
});

  const [profileData, setProfileData] = useState({
  name: "",
  phoneNo: "",
  email: "",
  address: "",
  bio: "",
  website: "",

  occupation: "",
  company: "",

  socialLinks: {
    twitter: "",
    instagram: "",
    facebook: "",
    linkedin: "",
    github: "",
    youtube: "",
  },

  privacy: {
    phoneNo: "only_me",
    email: "only_me",
    address: "subscribers",
    website: "everyone",
    followersList: "everyone",
    subscriptionsList: "everyone",
    bio: "everyone",
occupation: "everyone",
company: "everyone",

twitter: "everyone",
instagram: "everyone",
facebook: "everyone",
linkedin: "everyone",
github: "everyone",
youtube: "everyone",
  },
});

  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [selectedPhotoUrl, setSelectedPhotoUrl] = useState("");
  const fileInputRef = useRef(null);

  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredStates = nigeriaStates.filter((state) =>
    state.toLowerCase().includes(formData.address.toLowerCase())
  );

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

  occupation: user.occupation || "",
  company: user.company || "",

  socialLinks: {
    twitter: user.socialLinks?.twitter || "",
    instagram: user.socialLinks?.instagram || "",
    facebook: user.socialLinks?.facebook || "",
    linkedin: user.socialLinks?.linkedin || "",
    github: user.socialLinks?.github || "",
    youtube: user.socialLinks?.youtube || "",
  },

  privacy: {
  phoneNo: user.privacy?.phoneNo || "only_me",
  email: user.privacy?.email || "only_me",
  address: user.privacy?.address || "subscribers",
  website: user.privacy?.website || "everyone",
  followersList: user.privacy?.followersList || "everyone",
  subscriptionsList: user.privacy?.subscriptionsList || "everyone",

  bio: user.privacy?.bio || "everyone",
  occupation: user.privacy?.occupation || "everyone",
  company: user.privacy?.company || "everyone",

  twitter: user.privacy?.twitter || "everyone",
  instagram: user.privacy?.instagram || "everyone",
  facebook: user.privacy?.facebook || "everyone",
  linkedin: user.privacy?.linkedin || "everyone",
  github: user.privacy?.github || "everyone",
  youtube: user.privacy?.youtube || "everyone",
},
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
  phoneNo: currentUser.phoneNo || "",
  email: currentUser.email || "",
  address: currentUser.address || "",
  bio: currentUser.bio || "",
  website: currentUser.website || "",

  occupation: currentUser.occupation || "",
  company: currentUser.company || "",

  socialLinks: {
    twitter: currentUser.socialLinks?.twitter || "",
    instagram: currentUser.socialLinks?.instagram || "",
    facebook: currentUser.socialLinks?.facebook || "",
    linkedin: currentUser.socialLinks?.linkedin || "",
    github: currentUser.socialLinks?.github || "",
    youtube: currentUser.socialLinks?.youtube || "",
  },

  privacy: {
  phoneNo: user.privacy?.phoneNo || "only_me",
  email: user.privacy?.email || "only_me",
  address: user.privacy?.address || "subscribers",
  website: user.privacy?.website || "everyone",
  followersList: user.privacy?.followersList || "everyone",
  subscriptionsList: user.privacy?.subscriptionsList || "everyone",

  bio: user.privacy?.bio || "everyone",
  occupation: user.privacy?.occupation || "everyone",
  company: user.privacy?.company || "everyone",

  twitter: user.privacy?.twitter || "everyone",
  instagram: user.privacy?.instagram || "everyone",
  facebook: user.privacy?.facebook || "everyone",
  linkedin: user.privacy?.linkedin || "everyone",
  github: user.privacy?.github || "everyone",
  youtube: user.privacy?.youtube || "everyone",
},
});

     setProfileData({
  name: currentUser.name || "",
  phoneNo: currentUser.phoneNo || "",
  email: currentUser.email || "",
  address: currentUser.address || "",
  bio: currentUser.bio || "",
  website: currentUser.website || "",

  occupation: currentUser.occupation || "",
  company: currentUser.company || "",

  socialLinks: {
    twitter: currentUser.socialLinks?.twitter || "",
    instagram: currentUser.socialLinks?.instagram || "",
    facebook: currentUser.socialLinks?.facebook || "",
    linkedin: currentUser.socialLinks?.linkedin || "",
    github: currentUser.socialLinks?.github || "",
    youtube: currentUser.socialLinks?.youtube || "",
  },

  privacy: {
  phoneNo: user.privacy?.phoneNo || "only_me",
  email: user.privacy?.email || "only_me",
  address: user.privacy?.address || "subscribers",
  website: user.privacy?.website || "everyone",
  followersList: user.privacy?.followersList || "everyone",
  subscriptionsList: user.privacy?.subscriptionsList || "everyone",

  bio: user.privacy?.bio || "everyone",
  occupation: user.privacy?.occupation || "everyone",
  company: user.privacy?.company || "everyone",

  twitter: user.privacy?.twitter || "everyone",
  instagram: user.privacy?.instagram || "everyone",
  facebook: user.privacy?.facebook || "everyone",
  linkedin: user.privacy?.linkedin || "everyone",
  github: user.privacy?.github || "everyone",
  youtube: user.privacy?.youtube || "everyone",
},
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

  // clear normal + nested errors safely
  setErrors((prev) => {
  const copy = { ...prev };

  // remove direct field error
  delete copy[name];

  // remove nested errors properly
  delete copy[`socialLinks.${name}`];
  delete copy[`privacy.${name}`];

  return copy;
});
};
  

const handleNestedChange = (e, parent) => {
  const { name, value } = e.target;

  setFormData((prev) => ({
    ...prev,
    [parent]: {
      ...prev[parent],
      [name]: value,
    },
  }));

  setErrors((prev) => {
    const copy = { ...prev };
    delete copy[`${parent}.${name}`];
    return copy;
  });
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
  const fieldPath = issue.path.join(".");
  newErrors[fieldPath] = issue.message;
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
     setProfileData({
        name: updatedUser.name || "",
         phoneNo: updatedUser.phoneNo || "",
         email: updatedUser.email || "",
         address: updatedUser.address || "",
         bio: updatedUser.bio || "",
          website: updatedUser.website || "",

           occupation: updatedUser.occupation || "",
           company: updatedUser.company || "",

           socialLinks: {
          twitter: updatedUser.socialLinks?.twitter || "",
          instagram: updatedUser.socialLinks?.instagram || "",
          facebook: updatedUser.socialLinks?.facebook || "",
          linkedin: updatedUser.socialLinks?.linkedin || "",
          github: updatedUser.socialLinks?.github || "",
          youtube: updatedUser.socialLinks?.youtube || "",
          },

  privacy: {
  phoneNo: user.privacy?.phoneNo || "only_me",
  email: user.privacy?.email || "only_me",
  address: user.privacy?.address || "subscribers",
  website: user.privacy?.website || "everyone",
  followersList: user.privacy?.followersList || "everyone",
  subscriptionsList: user.privacy?.subscriptionsList || "everyone",

  bio: user.privacy?.bio || "everyone",
  occupation: user.privacy?.occupation || "everyone",
  company: user.privacy?.company || "everyone",

  twitter: user.privacy?.twitter || "everyone",
  instagram: user.privacy?.instagram || "everyone",
  facebook: user.privacy?.facebook || "everyone",
  linkedin: user.privacy?.linkedin || "everyone",
  github: user.privacy?.github || "everyone",
  youtube: user.privacy?.youtube || "everyone",
},
      });

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
    <div className="min-h-screen bg-[#0d0d14] text-[#f0eeff]">
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#2a2740] bg-[#0d0d14]">

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
                Update your public profile details.
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

                {/* {selectedPhoto && (
                  <div className="mt-3 text-sm text-[#9490b8]">
                    Selected file: {selectedPhoto.name}
                  </div>
                )} */}
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
                      +234
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
                      <VisibilitySelect
  name="phoneNo"
  value={formData.privacy.phoneNo}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
                 
                </Field>

                {/* BIO */}
                <div className="col-span-2">
                  <Field label="Bio">

                    <textarea
                      rows={3}
                      name="bio"
                      value={formData.bio}
                      onChange={handleChange}
                      maxLength={160}
                      className="w-full resize-none rounded-lg border border-[#2a2740] bg-[#1c1c2e] px-3 py-2 text-sm outline-none focus:border-[#7c6ff7]"
                      placeholder="A short bio"
                    />

                    <div className="mt-2 flex items-center justify-between text-xs text-[#9490b8]">
                      <span>Up to 160 characters</span>
                     <span className={formData.bio?.length > 140 ? "text-yellow-400" : ""}>
                    {formData.bio?.length || 0}/160
                     </span>
                    </div>

                    {errors.bio && (
                      <p className="mt-2 text-xs text-[#f09595]">
                        {errors.bio}
                      </p>
                    )}

                    <VisibilitySelect
  name="bio"
  value={formData.privacy.bio}
  onChange={(e) => handleNestedChange(e, "privacy")}
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
                
                   <VisibilitySelect
  name="email"
  value={formData.privacy.email}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
                </Field>

                {/* ADDRESS */}
                {/* <Field label="Address">
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
                </Field> */} 


                {/* ADDRESS */}
                 <div className="col-span-2">
                <Field label="Address">

                  <div className="relative">

                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        setTimeout(() => {
                          setShowSuggestions(false);
                        }, 200);
                      }}
                      placeholder="Search state..."
                      className="w-full px-3 py-2 bg-[#1c1c2e] border border-[#2a2740] text-[#f0eeff] rounded-lg outline-none focus:border-[#7c6ff7] text-sm"
                    />

                    {showSuggestions && formData.address && (
                      <div className="absolute z-50 mt-1 max-h-52 w-full overflow-y-auto rounded-lg border border-[#2a2740] bg-[#141420] shadow-lg">

                        {filteredStates.length > 0 ? (
                          filteredStates.map((state) => (
                            <button
                              key={state}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({
                                  ...prev,
                                  address: state,
                                }));

                                setShowSuggestions(false);
                              }}
                              className="w-full border-b border-[#2a2740] px-3 py-2 text-left text-sm text-[#f0eeff] transition hover:bg-[#1f1f35]"
                            >
                              {state}
                            </button>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-sm text-[#9490b8]">
                            No state found
                          </div>
                        )}

                      </div>
                    )}
                  </div>

                  {errors.address && (
                    <p className="mt-2 text-xs text-[#f09595]">
                      {errors.address}
                    </p>
                  )}

                  <VisibilitySelect
  name="address"
  value={formData.privacy.address}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
                </Field>
                  </div>
                

                {/* WEBSITE */}
                   <div className="col-span-2">
                <Field label="Personal Website">
                  <Input
                    name="website"
                    value={formData.website}
                    onChange={handleChange}
                    placeholder="https://yoursite.com"
                  />

                      <VisibilitySelect
  name="website"
  value={formData.privacy.website}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
                </Field>
                      </div>

                     <SectionTitle
  icon={<IdCard size={15} />}
  title="Professional"
/>

<div className="mb-8 grid grid-cols-2 gap-4">

<Field label="Occupation">
  <Input
    name="occupation"
    value={formData.occupation}
    onChange={handleChange}
    placeholder="Software Engineer"
/>
<VisibilitySelect
  name="occupation"
  value={formData.privacy.occupation}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
      
</Field>

<Field label="Company">
  <Input
    name="company"
    value={formData.company}
    onChange={handleChange}
    placeholder="OpenAI"
/>
<VisibilitySelect
  name="company"
  value={formData.privacy.company}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
      
</Field>

</div>

      <SectionTitle
  icon={<IdCard size={15} />}
  title="Social links"
/>

<div className="mb-8 grid grid-cols-2 gap-4">

  <Field label="Twitter">
    <Input
      name="twitter"
      value={formData.socialLinks.twitter}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://twitter.com/username"
    />
        
        {errors["socialLinks.twitter"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.twitter"]}
            </p>
        )}

   <VisibilitySelect
  name="twitter"
  value={formData.privacy.twitter}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

  <Field label="Instagram">
    <Input
      name="instagram"
      value={formData.socialLinks.instagram}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://instagram.com/username"
    />

       {errors["socialLinks.instagram"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.instagram"]}
            </p>
        )}

      <VisibilitySelect
  name="instagram"
  value={formData.privacy.instagram}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

  <Field label="Facebook">
    <Input
      name="facebook"
      value={formData.socialLinks.facebook}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://facebook.com/username"
    />

      {errors["socialLinks.facebook"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.facebook"]}
            </p>
        )}

     <VisibilitySelect
  name="facebook"
  value={formData.privacy.facebook}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

  <Field label="LinkedIn">
    <Input
      name="linkedin"
      value={formData.socialLinks.linkedin}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://linkedin.com/in/username"
    />

       {errors["socialLinks.linkedin"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.linkedin"]}
            </p>
        )}

    <VisibilitySelect
  name="linkedin"
  value={formData.privacy.linkedin}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

  <Field label="Github">
    <Input
      name="github"
      value={formData.socialLinks.github}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://github.com/username"
    />

      {errors["socialLinks.github"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.github"]}
            </p>
        )}

     <VisibilitySelect
  name="github"
  value={formData.privacy.github}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

  <Field label="YouTube">
    <Input
      name="youtube"
      value={formData.socialLinks.youtube}
      onChange={(e) => handleNestedChange(e, "socialLinks")}
      placeholder="https://youtube.com/@username"
    />
 
       {errors["socialLinks.youtube"] && (
          <p className="mt-2 text-xs text-[#f09595]">
            {errors["socialLinks.youtube"]}
            </p>
        )}

     <VisibilitySelect
  name="youtube"
  value={formData.privacy.youtube}
  onChange={(e) => handleNestedChange(e, "privacy")}
/>
  </Field>

</div>

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

function VisibilitySelect(props) {
  return (
    <select
      {...props}
      className="mt-2 w-full rounded-lg border border-[#2a2740] bg-[#1c1c2e] px-3 py-2 text-sm outline-none focus:border-[#7c6ff7]"
    >
      <option value="only_me">Only me</option>
      <option value="mutuals">Mutuals</option>
      <option value="subscribers">Subscribers</option>
      <option value="everyone">Everyone</option>
    </select>
  );
}
