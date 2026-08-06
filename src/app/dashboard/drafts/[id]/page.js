"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { blogAPI } from "@/utils/api";

export default function DraftPage() {
  const { id } = useParams();
const router = useRouter();

const [draft, setDraft] = useState(null);
const [loading, setLoading] = useState(true);

useEffect(() => {
  (async () => {
    try {
      const data = await blogAPI.getById(id);
      setDraft(data);
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  })();
}, [id]);
}
