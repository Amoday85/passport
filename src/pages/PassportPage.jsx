import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select"

import {
  ArrowLeft,
  MapPin,
  X,
  Camera,
  Plus,
  Mic,
  Save,
  Trash2,
  Info,
} from "lucide-react"

const TT_TYPES = [
  { id: "tt", label: "Торгова точка" },
  { id: "network", label: "Мережа" },
  { id: "national", label: "Нац. мережа" },
  { id: "competitor", label: "Конкурент" },
]

// Заглушки — позже подтянем из БД
const PRICE_CATEGORIES = [
  { id: "a", label: "A (умовно)" },
  { id: "b", label: "B (умовно)" },
  { id: "c", label: "C (умовно)" },
]

const DISTRIBUTORS = [
  { id: "d1", label: "Дистриб’ютор 1" },
  { id: "d2", label: "Дистриб’ютор 2" },
]

const MANUFACTURERS = [
  { id: "highfoam", label: "Highfoam" },
  { id: "matroluxe", label: "Matroluxe" },
  { id: "emm", label: "EMM" },
  { id: "come_for", label: "Come-for" },
  { id: "musson", label: "Musson" },
  { id: "vegal", label: "Vegal" },
]

function todayUA() {
  const d = new Date()
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}.${mm}.${yyyy}`
}

function clampInt(v, min, max) {
  const n = Number.parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10)
  if (Number.isNaN(n)) return min
  return Math.max(min, Math.min(max, n))
}

function isBlank(v) {
  return !String(v ?? "").trim()
}

function cn(...parts) {
  return parts.filter(Boolean).join(" ")
}

function pct(part, total) {
  if (!total) return 0
  return Math.round((part / total) * 100)
}

export function PassportPage() {
  const nav = useNavigate()
  const { profile } = useAuth()

  // ===== State =====

  const [orgTT, setOrgTT] = useState({
    orgMode: "select", // select | new
    orgQuery: "",
    orgNameNew: "",

    ttMode: "select", // select | new
    ttQuery: "",
    ttNameNew: "",
  })

  const [contacts, setContacts] = useState({
    modalOpen: false,
    contactName: "",
    position: "",
    phone: "",
    email: "",
    ttDescription: "",
    ttTypeId: "tt",
  })

  const [commercial, setCommercial] = useState({
    sellsPillows: false,
    viaDistributor: false,
    distributorId: "",
    priceCategoryId: "",
  })

  const [address, setAddress] = useState({
    city: "",
    street: "",
    house: "",
    geo: null, // { lat, lng, resolvedAddress }
  })

  const [photos, setPhotos] = useState([]) // { id, file, url }

  const [manufacturers, setManufacturers] = useState({
    activeAddId: "",
    editorOpen: false,
    pp: 0,
    kv: 0,
    selected: [], // { manufacturerId, pp, kv }
  })

  const [modelRange, setModelRange] = useState({
    highfoamCount: 0,
    privateCount: 0,
  })

  const [pricing, setPricing] = useState({
    econom: 0,
    middle: 0,
  })

  const premium = useMemo(() => {
    const e = clampInt(pricing.econom, 0, 100)
    const m = clampInt(pricing.middle, 0, 100)
    return Math.max(0, 100 - e - m)
  }, [pricing.econom, pricing.middle])

  const [note, setNote] = useState({
    finalText: "",
  })

  const [ui, setUI] = useState({
    confirmBackOpen: false,
    confirmGeoOpen: false,
    savedOpen: false,
    photoPreview: null, // url
  })

  const visitDate = useMemo(() => todayUA(), [])

  const isHighfoamSelected = useMemo(() => {
    return manufacturers.selected.some((x) => x.manufacturerId === "highfoam")
  }, [manufacturers.selected])

  // ===== readiness (progress) =====
  const readiness = useMemo(() => {
    let score = 0
    const add = (v) => (score += v)

    const hasOrg = (orgTT.orgMode === "select" ? !isBlank(orgTT.orgQuery) : !isBlank(orgTT.orgNameNew))
    const hasTT = (orgTT.ttMode === "select" ? !isBlank(orgTT.ttQuery) : !isBlank(orgTT.ttNameNew))
    if (hasOrg) add(12)
    if (hasTT) add(12)

    const hasContacts = !isBlank(contacts.contactName) || !isBlank(contacts.phone) || !isBlank(contacts.ttTypeId)
    if (hasContacts) add(8)

    const hasAddr = !isBlank(address.city) && !isBlank(address.street) && !isBlank(address.house)
    if (hasAddr) add(10)
    if (address.geo) add(10)

    if (photos.length) add(12)
    if (manufacturers.selected.length) add(14)

    const hasSegments = (clampInt(pricing.econom, 0, 100) + clampInt(pricing.middle, 0, 100)) <= 100
    if (hasSegments) add(10)

    if (!isBlank(note.finalText)) add(12)

    return Math.min(100, score)
  }, [orgTT, contacts, address, photos.length, manufacturers.selected.length, pricing, note.finalText])

  const isFormEmpty = useMemo(() => {
    const hasOrg =
      !isBlank(orgTT.orgQuery) ||
      !isBlank(orgTT.orgNameNew) ||
      !isBlank(orgTT.ttQuery) ||
      !isBlank(orgTT.ttNameNew)

    const hasContacts =
      !isBlank(contacts.contactName) ||
      !isBlank(contacts.position) ||
      !isBlank(contacts.phone) ||
      !isBlank(contacts.email) ||
      !isBlank(contacts.ttDescription) ||
      !isBlank(contacts.ttTypeId)

    const hasCommercial =
      commercial.sellsPillows ||
      commercial.viaDistributor ||
      !isBlank(commercial.distributorId) ||
      !isBlank(commercial.priceCategoryId)

    const hasAddress =
      !isBlank(address.city) ||
      !isBlank(address.street) ||
      !isBlank(address.house) ||
      !!address.geo

    const hasPhotos = photos.length > 0
    const hasManu = manufacturers.selected.length > 0
    const hasPricing =
      clampInt(pricing.econom, 0, 100) > 0 || clampInt(pricing.middle, 0, 100) > 0
    const hasNote = !isBlank(note.finalText)

    return !(hasOrg || hasContacts || hasCommercial || hasAddress || hasPhotos || hasManu || hasPricing || hasNote)
  }, [
    orgTT,
    contacts,
    commercial,
    address,
    photos.length,
    manufacturers.selected.length,
    pricing,
    note.finalText,
  ])

  // ===== Handlers =====

  function goBack() {
    if (isFormEmpty) {
      nav("/app/surveys/start")
      return
    }
    setUI((s) => ({ ...s, confirmBackOpen: true }))
  }

  function discardAndBack() {
    setUI((s) => ({ ...s, confirmBackOpen: false }))
    nav("/app/surveys/start")
  }

  function requestGeo() {
    // Заглушка — позже реальная геолокация + reverse geocode
    setAddress((a) => ({
      ...a,
      geo: {
        lat: 49.84,
        lng: 24.03,
        resolvedAddress: "Визначено: приклад адреси (заглушка)",
      },
    }))
  }

  function clearGeo() {
    setAddress((a) => ({ ...a, geo: null }))
  }

  function onPickPhotoFiles(fileList) {
    const files = Array.from(fileList || [])
    if (!files.length) return

    setPhotos((prev) => {
      const next = [...prev]
      for (const f of files) {
        if (next.length >= 4) break
        const id = crypto.randomUUID?.() ?? String(Date.now() + Math.random())
        const url = URL.createObjectURL(f)
        next.push({ id, file: f, url })
      }
      return next
    })
  }

  function removePhoto(id) {
    setPhotos((prev) => {
      const item = prev.find((p) => p.id === id)
      if (item?.url) URL.revokeObjectURL(item.url)
      return prev.filter((p) => p.id !== id)
    })
  }

  function startAddManufacturer() {
    if (!manufacturers.activeAddId) return
    setManufacturers((m) => ({ ...m, editorOpen: true, pp: 0, kv: 0 }))
  }

  function cancelManufacturerEditor() {
    setManufacturers((m) => ({ ...m, editorOpen: false }))
  }

  function saveManufacturerEditor() {
    setManufacturers((m) => {
      const id = m.activeAddId
      if (!id) return m

      const pp = clampInt(m.pp, 0, 9999999)
      const kv = clampInt(m.kv, 0, 999)
      const exists = m.selected.some((x) => x.manufacturerId === id)

      if (exists) {
        return {
          ...m,
          selected: m.selected.map((x) => (x.manufacturerId === id ? { ...x, pp, kv } : x)),
          editorOpen: false,
        }
      }

      return {
        ...m,
        selected: [...m.selected, { manufacturerId: id, pp, kv }],
        editorOpen: false,
      }
    })
  }

  function editManufacturer(manufacturerId) {
    const item = manufacturers.selected.find((x) => x.manufacturerId === manufacturerId)
    if (!item) return
    setManufacturers((m) => ({
      ...m,
      activeAddId: manufacturerId,
      pp: item.pp,
      kv: item.kv,
      editorOpen: true,
    }))
  }

  function removeManufacturer(manufacturerId) {
    setManufacturers((m) => ({
      ...m,
      selected: m.selected.filter((x) => x.manufacturerId !== manufacturerId),
      activeAddId: m.activeAddId === manufacturerId ? "" : m.activeAddId,
      editorOpen: m.activeAddId === manufacturerId ? false : m.editorOpen,
    }))
  }

  function saveReport() {
    if (!address.geo) {
      setUI((s) => ({ ...s, confirmGeoOpen: true }))
      return
    }
    doSave()
  }

  function saveWithoutGeo() {
    setUI((s) => ({ ...s, confirmGeoOpen: false }))
    doSave()
  }

  function doSave() {
    // Пока заглушка — позже реальное сохранение в Supabase + Drive
    setUI((s) => ({ ...s, savedOpen: true }))
  }

  function continueAfterSave() {
    setUI((s) => ({ ...s, savedOpen: false }))
    nav("/app/surveys/start")
  }

  // ===== Manufacturer analytics (simple demo) =====
  const totalPP = manufacturers.selected.reduce((s, x) => s + clampInt(x.pp, 0, 9999999), 0)
  const totalKV = manufacturers.selected.reduce((s, x) => s + clampInt(x.kv, 0, 999), 0)

  // ===== UI =====
  return (
    <div className="min-h-screen px-4 py-4 flex justify-center glow">
      <div className="w-full max-w-[640px] space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between text-[13px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={goBack}
              aria-label="Назад"
              className="rounded-full"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span>Сьогодні: {visitDate}</span>
          </div>
          <span>Менеджер: {profile?.full_name ?? "—"}</span>
        </div>

        {/* Title + progress */}
        <div className="glass rounded-3xl p-4">
          <div className="text-xl font-semibold leading-tight">Звіт ТТ</div>
          <div className="text-sm text-muted-foreground">Нова торгова точка</div>

          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Готовність звіту</span>
              <span>{readiness}%</span>
            </div>
            <Progress value={readiness} className="h-2 bg-white/10" />
          </div>
        </div>

        {/* Організація та ТТ */}
        <Section title="Організація та ТТ">
          <div className="space-y-4">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Організація
              </div>

              <Tabs
                value={orgTT.orgMode}
                onValueChange={(v) => setOrgTT((s) => ({ ...s, orgMode: v }))}
              >
                <TabsList className="w-full grid grid-cols-2 bg-white/[0.04] p-1 rounded-2xl">
                  <TabsTrigger
                    value="select"
                    className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-foreground"
                  >
                    Вибрати зі списку
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-foreground"
                  >
                    Нова організація
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-3">
                {orgTT.orgMode === "select" ? (
                  <LabeledInput
                    label="Пошук організації"
                    value={orgTT.orgQuery}
                    onChange={(v) => setOrgTT((s) => ({ ...s, orgQuery: v }))}
                    placeholder="Почніть вводити назву…"
                  />
                ) : (
                  <LabeledInput
                    label="Нова організація"
                    value={orgTT.orgNameNew}
                    onChange={(v) => setOrgTT((s) => ({ ...s, orgNameNew: v }))}
                    placeholder="Введіть назву організації…"
                  />
                )}
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                Торгова точка
              </div>

              <Tabs
                value={orgTT.ttMode}
                onValueChange={(v) => setOrgTT((s) => ({ ...s, ttMode: v }))}
              >
                <TabsList className="w-full grid grid-cols-2 bg-white/[0.04] p-1 rounded-2xl">
                  <TabsTrigger
                    value="select"
                    className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-foreground"
                  >
                    Вибрати зі списку
                  </TabsTrigger>
                  <TabsTrigger
                    value="new"
                    className="rounded-xl data-[state=active]:bg-primary/20 data-[state=active]:text-foreground"
                  >
                    Нова ТТ
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="mt-3">
                {orgTT.ttMode === "select" ? (
                  <LabeledInput
                    label="Пошук ТТ"
                    value={orgTT.ttQuery}
                    onChange={(v) => setOrgTT((s) => ({ ...s, ttQuery: v }))}
                    placeholder="Почніть вводити назву ТТ…"
                  />
                ) : (
                  <LabeledInput
                    label="Нова ТТ"
                    value={orgTT.ttNameNew}
                    onChange={(v) => setOrgTT((s) => ({ ...s, ttNameNew: v }))}
                    placeholder="Введіть назву ТТ…"
                  />
                )}
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full justify-center gap-2 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              onClick={() => setContacts((c) => ({ ...c, modalOpen: true }))}
            >
              <Info className="h-4 w-4" />
              Контакти та тип ТТ
            </Button>

            <div className="space-y-3 pt-1">
              <ToggleRow
                label="Продаж подушок"
                checked={commercial.sellsPillows}
                onCheckedChange={(v) => setCommercial((s) => ({ ...s, sellsPillows: v }))}
              />

              <ToggleRow
                label="Через дистриб’ютора"
                checked={commercial.viaDistributor}
                onCheckedChange={(v) =>
                  setCommercial((s) => ({
                    ...s,
                    viaDistributor: v,
                    distributorId: v ? s.distributorId : "",
                  }))
                }
              />

              {commercial.viaDistributor && (
                <LabeledSelect
                  label="Дистриб’ютор"
                  value={commercial.distributorId}
                  onValueChange={(v) => setCommercial((s) => ({ ...s, distributorId: v }))}
                  placeholder="Оберіть дистриб’ютора…"
                  items={DISTRIBUTORS}
                />
              )}

              <div className="flex items-center justify-between gap-3">
                <div className="text-sm text-muted-foreground">Прайс</div>
                <div className="w-[260px]">
                  <LabeledSelect
                    label=""
                    value={commercial.priceCategoryId}
                    onValueChange={(v) => setCommercial((s) => ({ ...s, priceCategoryId: v }))}
                    placeholder="Оберіть…"
                    items={PRICE_CATEGORIES}
                  />
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Адреса */}
        <Section title="Адреса ТТ">
          <div className="space-y-4">
            <div className="grid gap-3">
              <LabeledInput
                label="Місто"
                value={address.city}
                onChange={(v) => setAddress((s) => ({ ...s, city: v }))}
                placeholder="Почніть вводити… (пізніше буде НП)"
              />
              <LabeledInput
                label="Вулиця"
                value={address.street}
                onChange={(v) => setAddress((s) => ({ ...s, street: v }))}
                placeholder="Почніть вводити… (пізніше буде НП)"
              />
              <LabeledInput
                label="Будинок"
                value={address.house}
                onChange={(v) => setAddress((s) => ({ ...s, house: v }))}
                placeholder="№"
              />
            </div>

            <Button
              variant="secondary"
              className="w-full justify-center gap-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
              onClick={requestGeo}
            >
              <MapPin className="h-4 w-4" />
              Визначити геолокацію
            </Button>

            {address.geo && (
              <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2">
                <div className="text-sm text-muted-foreground">{address.geo.resolvedAddress}</div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={clearGeo}
                  aria-label="Видалити гео"
                  className="rounded-xl"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </Section>

        {/* Фото */}
        <Section title="Фотозвіт">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Додайте фото з камери</span>
              <span>макс. 4</span>
            </div>

            <div className="flex flex-wrap gap-3">
              {photos.map((p) => (
                <div
                  key={p.id}
                  className="relative h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]"
                >
                  <button
                    type="button"
                    className="h-full w-full"
                    onClick={() => setUI((s) => ({ ...s, photoPreview: p.url }))}
                    title="Переглянути"
                  >
                    <img src={p.url} alt="Фото" className="h-full w-full object-cover" />
                  </button>

                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-1 top-1 h-7 w-7 rounded-xl bg-black/40 hover:bg-black/55"
                    onClick={() => removePhoto(p.id)}
                    aria-label="Видалити фото"
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}

              {photos.length < 4 && (
                <label className="h-20 w-20 cursor-pointer rounded-2xl border border-dashed border-white/15 bg-white/[0.02] hover:bg-white/[0.05] flex flex-col items-center justify-center gap-1">
                  <Camera className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[11px] text-muted-foreground">Додати</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={(e) => onPickPhotoFiles(e.target.files)}
                  />
                </label>
              )}
            </div>
          </div>
        </Section>

        {/* Виробники */}
        <Section title="Виробники на виставці">
          <div className="space-y-3">
            <LabeledSelect
              label=""
              value={manufacturers.activeAddId}
              onValueChange={(v) => setManufacturers((s) => ({ ...s, activeAddId: v }))}
              placeholder="+ Додати виробника"
              items={MANUFACTURERS.map((m) => ({
                ...m,
                disabled: manufacturers.selected.some((x) => x.manufacturerId === m.id),
              }))}
            />

            <Button
              variant="outline"
              className="w-full justify-center gap-2 rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
              disabled={!manufacturers.activeAddId}
              onClick={startAddManufacturer}
            >
              <Plus className="h-4 w-4" />
              Додати показники (ПП/КВ)
            </Button>

            {manufacturers.editorOpen && (
              <div className="glass-soft rounded-3xl p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">Показники</div>
                  <Badge className="bg-primary/20 text-foreground border border-white/10">
                    {MANUFACTURERS.find((x) => x.id === manufacturers.activeAddId)?.label ??
                      manufacturers.activeAddId}
                  </Badge>
                </div>

                <NumberSlider
                  label="Потенційні продажі (шт/міс)"
                  max={9999999}
                  value={manufacturers.pp}
                  onChange={(v) => setManufacturers((s) => ({ ...s, pp: v }))}
                />

                <NumberSlider
                  label="К-ть місць (шт)"
                  max={999}
                  value={manufacturers.kv}
                  onChange={(v) => setManufacturers((s) => ({ ...s, kv: v }))}
                />

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="secondary"
                    className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
                    onClick={cancelManufacturerEditor}
                  >
                    Скасувати
                  </Button>
                  <Button className="rounded-2xl" onClick={saveManufacturerEditor}>
                    Зберегти
                  </Button>
                </div>
              </div>
            )}

            {manufacturers.selected.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 pt-1">
                  {manufacturers.selected.map((it) => {
                    const label =
                      MANUFACTURERS.find((m) => m.id === it.manufacturerId)?.label ?? it.manufacturerId
                    return (
                      <button
                        key={it.manufacturerId}
                        type="button"
                        onClick={() => editManufacturer(it.manufacturerId)}
                        className="group inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-sm hover:bg-white/[0.06]"
                        title="Натисніть, щоб змінити"
                      >
                        <span className="font-medium">{label}</span>
                        <span className="text-xs text-muted-foreground">
                          {it.pp}/{it.kv}
                        </span>
                        <span
                          onClick={(e) => {
                            e.stopPropagation()
                            removeManufacturer(it.manufacturerId)
                          }}
                          className="ml-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-black/20 opacity-75 hover:opacity-100"
                          role="button"
                          aria-label="Видалити"
                        >
                          <X className="h-3 w-3" />
                        </span>
                      </button>
                    )
                  })}
                </div>

                {/* Analytics like screenshot: two bars + legend */}
                <div className="glass-soft rounded-3xl p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Частка продажів
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                        {/* blended bar: first = primary, rest = muted */}
                        <div
                          className="h-full bg-primary/80"
                          style={{
                            width: `${pct(
                              clampInt(manufacturers.selected[0]?.pp ?? 0, 0, 9999999),
                              totalPP
                            )}%`,
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="text-xs uppercase tracking-wide text-muted-foreground">
                        Частка місць
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
                        <div
                          className="h-full bg-primary/80"
                          style={{
                            width: `${pct(
                              clampInt(manufacturers.selected[0]?.kv ?? 0, 0, 999),
                              totalKV
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    {manufacturers.selected.slice(0, 4).map((it) => {
                      const label =
                        MANUFACTURERS.find((m) => m.id === it.manufacturerId)?.label ?? it.manufacturerId
                      const ppP = pct(clampInt(it.pp, 0, 9999999), totalPP)
                      const kvP = pct(clampInt(it.kv, 0, 999), totalKV)
                      return (
                        <div key={it.manufacturerId} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-primary/80" />
                            <span className="text-muted-foreground">{label}</span>
                          </div>
                          <span className="text-muted-foreground">{ppP}% / {kvP}%</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </Section>

        {/* Модельний ряд */}
        {isHighfoamSelected && (
          <Section title="Модельний ряд">
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="justify-between rounded-2xl border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                onClick={() => setModelRange((s) => ({ ...s, highfoamCount: s.highfoamCount + 1 }))}
              >
                <span>Highfoam</span>
                <Badge className="bg-primary/20 border border-white/10">{modelRange.highfoamCount}</Badge>
              </Button>

              <Button
                variant="outline"
                className="justify-between rounded-2xl border-white/10 bg-white/[0.02] opacity-60"
                disabled
              >
                <span>Private Label</span>
                <Badge className="bg-white/10 border border-white/10">{modelRange.privateCount}</Badge>
              </Button>
            </div>

            <div className="text-xs text-muted-foreground">
              Модалки вибору брендів Highfoam/Private додамо наступним кроком.
            </div>
          </Section>
        )}

        {/* Цінові сегменти */}
        <Section title="Цінові сегменти (%)">
          <div className="space-y-4">
            <NumberSlider
              label="Економ"
              max={100}
              value={pricing.econom}
              onChange={(v) => setPricing((s) => ({ ...s, econom: clampInt(v, 0, 100) }))}
            />

            <NumberSlider
              label="Середній"
              max={100}
              value={pricing.middle}
              onChange={(v) => setPricing((s) => ({ ...s, middle: clampInt(v, 0, 100) }))}
            />

            <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/[0.03] px-4 py-3">
              <div className="text-sm text-muted-foreground">Преміум</div>
              <div className="text-lg font-semibold">{premium}</div>
            </div>

            {clampInt(pricing.econom, 0, 100) + clampInt(pricing.middle, 0, 100) > 100 && (
              <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                Сума Економ + Середній не повинна перевищувати 100%
              </div>
            )}
          </div>
        </Section>

        {/* Примітка */}
        <Section title="Коментарі">
          <div className="space-y-3">
            <Textarea
              value={note.finalText}
              onChange={(e) => setNote((s) => ({ ...s, finalText: e.target.value }))}
              placeholder="Введіть текст або диктуйте голосом…"
              className="min-h-[120px] rounded-3xl bg-white/[0.03] border-white/10 focus-visible:ring-primary/40"
            />
            <Button
              variant="secondary"
              className="w-full justify-center gap-2 rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
              onClick={() => alert("Голос + AI додамо наступним кроком")}
            >
              <Mic className="h-4 w-4" />
              Диктувати (AI)
            </Button>
          </div>
        </Section>

        {/* Save */}
        <div className="pb-8">
          <Button
            className="w-full h-12 text-base font-semibold gap-2 rounded-2xl"
            onClick={saveReport}
          >
            <Save className="h-4 w-4" />
            Зберегти звіт
          </Button>
        </div>

        {/* ===== Dialogs ===== */}

        {/* Back confirm */}
        <Dialog open={ui.confirmBackOpen} onOpenChange={(open) => setUI((s) => ({ ...s, confirmBackOpen: open }))}>
          <DialogContent className="glass rounded-3xl border-white/10">
            <DialogHeader>
              <DialogTitle>Є незбережені зміни</DialogTitle>
              <DialogDescription>Зберегти звіт перед виходом?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
                onClick={() => setUI((s) => ({ ...s, confirmBackOpen: false }))}
              >
                Скасувати
              </Button>
              <Button
                variant="destructive"
                className="rounded-2xl gap-2"
                onClick={discardAndBack}
              >
                <Trash2 className="h-4 w-4" />
                Вийти без збереження
              </Button>
              <Button
                className="rounded-2xl"
                onClick={() => {
                  setUI((s) => ({ ...s, confirmBackOpen: false }))
                  saveReport()
                }}
              >
                Зберегти
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Geo confirm */}
        <Dialog open={ui.confirmGeoOpen} onOpenChange={(open) => setUI((s) => ({ ...s, confirmGeoOpen: open }))}>
          <DialogContent className="glass rounded-3xl border-white/10">
            <DialogHeader>
              <DialogTitle>Геолокація не визначена</DialogTitle>
              <DialogDescription>Зберегти звіт без геолокації?</DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
                onClick={() => setUI((s) => ({ ...s, confirmGeoOpen: false }))}
              >
                Скасувати
              </Button>
              <Button className="rounded-2xl" onClick={saveWithoutGeo}>
                Зберегти без геолокації
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Saved */}
        <Dialog open={ui.savedOpen} onOpenChange={(open) => setUI((s) => ({ ...s, savedOpen: open }))}>
          <DialogContent className="glass rounded-3xl border-white/10">
            <DialogHeader>
              <DialogTitle>Звіт збережено</DialogTitle>
              <DialogDescription>Дані успішно синхронізовано (поки заглушка).</DialogDescription>
            </DialogHeader>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ТТ</span>
                <span className="font-medium">
                  {orgTT.ttMode === "new" ? orgTT.ttNameNew || "—" : orgTT.ttQuery || "—"}
                </span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Виробники</span>
                <span className="font-medium">{manufacturers.selected.length}</span>
              </div>
              <div className="mt-2 flex justify-between">
                <span className="text-muted-foreground">Фото</span>
                <span className="font-medium">{photos.length}</span>
              </div>
            </div>

            <DialogFooter>
              <Button className="w-full rounded-2xl" onClick={continueAfterSave}>
                Продовжити
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Contacts modal */}
        <Dialog
          open={contacts.modalOpen}
          onOpenChange={(open) => setContacts((c) => ({ ...c, modalOpen: open }))}
        >
          <DialogContent className="glass rounded-3xl border-white/10 sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle>Контактна інформація</DialogTitle>
              <DialogDescription>Заповніть контакти та тип торгової точки</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="grid gap-3">
                <LabeledInput
                  label="Контактна особа (ПІБ)"
                  value={contacts.contactName}
                  onChange={(v) => setContacts((s) => ({ ...s, contactName: v }))}
                  placeholder=""
                />
                <LabeledInput
                  label="Посада"
                  value={contacts.position}
                  onChange={(v) => setContacts((s) => ({ ...s, position: v }))}
                  placeholder=""
                />
                <LabeledInput
                  label="Телефон"
                  value={contacts.phone}
                  onChange={(v) => setContacts((s) => ({ ...s, phone: v }))}
                  placeholder=""
                />
                <LabeledInput
                  label="Email"
                  value={contacts.email}
                  onChange={(v) => setContacts((s) => ({ ...s, email: v }))}
                  placeholder=""
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Опис ТТ</Label>
                <Textarea
                  value={contacts.ttDescription}
                  onChange={(e) => setContacts((s) => ({ ...s, ttDescription: e.target.value }))}
                  placeholder="Опис торгової точки…"
                  className="min-h-[90px] rounded-3xl bg-white/[0.03] border-white/10 focus-visible:ring-primary/40"
                />
              </div>

              <div className="pt-2">
                <div className="text-xs uppercase tracking-wide text-muted-foreground mb-2">
                  Тип торгової точки
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {TT_TYPES.map((t) => {
                    const active = contacts.ttTypeId === t.id
                    return (
                      <Button
                        key={t.id}
                        type="button"
                        variant="secondary"
                        className={cn(
                          "rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/10",
                          active && "bg-primary/20 border-primary/30"
                        )}
                        onClick={() => setContacts((s) => ({ ...s, ttTypeId: t.id }))}
                      >
                        {t.label}
                      </Button>
                    )
                  })}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                variant="secondary"
                className="rounded-2xl bg-white/[0.04] hover:bg-white/[0.07]"
                onClick={() => setContacts((c) => ({ ...c, modalOpen: false }))}
              >
                Скасувати
              </Button>
              <Button className="rounded-2xl" onClick={() => setContacts((c) => ({ ...c, modalOpen: false }))}>
                Готово
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Photo preview */}
        <Dialog
          open={!!ui.photoPreview}
          onOpenChange={(open) => setUI((s) => ({ ...s, photoPreview: open ? s.photoPreview : null }))}
        >
          <DialogContent className="glass rounded-3xl border-white/10 max-w-[90vw] sm:max-w-[640px] p-0 overflow-hidden">
            {ui.photoPreview && (
              <div className="relative">
                <img src={ui.photoPreview} alt="Preview" className="w-full h-auto" />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute right-3 top-3 rounded-xl bg-black/40 hover:bg-black/55"
                  onClick={() => setUI((s) => ({ ...s, photoPreview: null }))}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

/* ====== Small UI helpers ====== */

function Section({ title, children }) {
  return (
    <Card className="glass rounded-3xl">
      <CardContent className="pt-5 space-y-4">
        <div className="text-sm font-semibold tracking-tight">{title}</div>
        {children}
      </CardContent>
    </Card>
  )
}

function LabeledInput({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs text-muted-foreground">{label}</Label> : null}
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-2xl bg-white/[0.03] border-white/10 focus-visible:ring-primary/40"
      />
    </div>
  )
}

function LabeledSelect({ label, value, onValueChange, placeholder, items }) {
  return (
    <div className="space-y-1.5">
      {label ? <Label className="text-xs text-muted-foreground">{label}</Label> : null}

      <Select value={value || ""} onValueChange={onValueChange}>
        <SelectTrigger className="rounded-2xl bg-white/[0.03] border-white/10 focus:ring-primary/40">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="bg-[#0b1020] border-white/10">
          {items.map((it) => (
            <SelectItem key={it.id} value={it.id} disabled={!!it.disabled}>
              {it.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

function ToggleRow({ label, checked, onCheckedChange }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-muted-foreground">{label}</div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  )
}

function NumberSlider({ label, max, value, onChange }) {
  const safe = clampInt(value, 0, max)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm text-muted-foreground">{label}</div>
        <Input
          className="w-24 text-right rounded-2xl bg-white/[0.03] border-white/10 focus-visible:ring-primary/40"
          value={safe}
          onChange={(e) => onChange(clampInt(e.target.value, 0, max))}
        />
      </div>

      <input
        type="range"
        min={0}
        max={max}
        value={safe}
        onChange={(e) => onChange(clampInt(e.target.value, 0, max))}
      />
    </div>
  )
}