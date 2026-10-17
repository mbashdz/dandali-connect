"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  Store, 
  MapPin, 
  MessageCircle, 
  Search, 
  PlusCircle, 
  Phone, 
  CheckCircle2, 
  Sparkles,
  Loader2,
  Camera,
  Image as ImageIcon,
  ShieldAlert,
  Pencil,
  Trash2,
  Maximize2,
  X
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useAppSettings } from "@/contexts/app-settings-context";
import { useToast } from "@/hooks/use-toast";
import { getKasuwaItems, createKasuwaItem, markKasuwaItemAsSold, updateKasuwaItem, deleteKasuwaItem } from "@/lib/firebase/kasuwa";
import { uploadFile } from "@/lib/firebase/storage";
import { ReportDialog } from "@/components/report-dialog";
import { CameraCaptureModal } from "@/components/camera-capture-modal";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { KasuwaItem } from "@/types";

export function KasuwaMarketplace() {
  const { currentUser } = useAuth();
  const { language, t } = useAppSettings();
  const { toast } = useToast();

  const [items, setItems] = useState<KasuwaItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<KasuwaItem | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);
  const [isKasuwaCameraOpen, setIsKasuwaCameraOpen] = useState(false);
  const [reportingItem, setReportingItem] = useState<KasuwaItem | null>(null);

  // Seller Edit modal state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPrice, setEditPrice] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCategory, setEditCategory] = useState<KasuwaItem["category"]>("fashion");
  const [editWhatsapp, setEditWhatsapp] = useState("");
  const [isSavingSellerAction, setIsSavingSellerAction] = useState(false);

  // New listing state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [location, setLocation] = useState("");
  const [category, setCategory] = useState<KasuwaItem["category"]>("fashion");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [itemImageFiles, setItemImageFiles] = useState<File[]>([]);
  const [itemImagePreviews, setItemImagePreviews] = useState<string[]>([]);
  const [isPublishing, setIsPublishing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { id: "all", labelEn: "All Items", labelHa: "Duka Kayan" },
    { id: "fashion", labelEn: "Fashion & Attire", labelHa: "Kayan Sawa" },
    { id: "electronics", labelEn: "Phones & Tech", labelHa: "Wayoyi & Na'urori" },
    { id: "food", labelEn: "Agriculture & Food", labelHa: "Noma & Abinci" },
    { id: "handicrafts", labelEn: "Art & Handicrafts", labelHa: "Sana'o'in Hannu" },
  ];

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const liveItems = await getKasuwaItems(selectedCategory);
      setItems(liveItems);
    } catch (err) {
      console.error("Error loading kasuwa items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory]);

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const incoming = Array.from(e.target.files);
      const combined = [...itemImageFiles, ...incoming].slice(0, 4);
      setItemImageFiles(combined);
      setItemImagePreviews(combined.map((f) => URL.createObjectURL(f)));
    }
  };

  const removePickedImage = (idx: number) => {
    const updatedFiles = itemImageFiles.filter((_, i) => i !== idx);
    setItemImageFiles(updatedFiles);
    setItemImagePreviews(updatedFiles.map((f) => URL.createObjectURL(f)));
  };

  const handleListItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price || !currentUser || isPublishing) return;

    setIsPublishing(true);
    try {
      let uploadedUrls: string[] = [];
      if (itemImageFiles.length > 0) {
        uploadedUrls = await Promise.all(
          itemImageFiles.map((file) => uploadFile(file, `kasuwa/${currentUser.uid}`))
        );
      } else {
        uploadedUrls = ["https://images.unsplash.com/photo-1590736969955-71cc94801759?w=800&auto=format&fit=crop&q=80"];
      }

      const cleanWhatsapp = whatsapp.replace(/[^0-9]/g, '');

      await createKasuwaItem({
        title,
        description,
        price: Number(price),
        currency: "NGN",
        location: location || "Nigeria",
        category,
        imageUrl: uploadedUrls[0],
        imageUrls: uploadedUrls,
        sellerUid: currentUser.uid,
        sellerName: currentUser.name || "Zaure Merchant",
        sellerPhone: phone || `+${cleanWhatsapp || "2348000000000"}`,
        sellerWhatsapp: cleanWhatsapp || "2348000000000",
        sellerAvatarUrl: currentUser.avatarUrl || "https://placehold.co/100x100.png",
      });

      toast({
        title: language === "ha" ? "An Dora Kaya a Kasuwa!" : "Item Listed Successfully!",
        description: language === "ha" ? "Kayanka yanzu yana bayyana ga masu saye." : "Your product is now visible to buyers across the marketplace.",
      });

      setTitle("");
      setDescription("");
      setPrice("");
      setLocation("");
      setPhone("");
      setWhatsapp("");
      setItemImageFiles([]);
      setItemImagePreviews([]);
      setIsListingModalOpen(false);
      fetchItems();
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Listing failed",
        description: err.message || "Please check connection.",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleToggleSold = async (item: KasuwaItem) => {
    if (isSavingSellerAction) return;
    setIsSavingSellerAction(true);
    try {
      const nextSold = !item.isSold;
      await markKasuwaItemAsSold(item.id, nextSold);
      const updated = { ...item, isSold: nextSold };
      setSelectedItem(updated);
      setItems((prev) => prev.map((it) => (it.id === item.id ? updated : it)));
      toast({
        title: nextSold
          ? language === "ha" ? "An saka alamar An Sayar" : "Marked as Sold"
          : language === "ha" ? "An dawo da kaya Kasuwa" : "Marked as Available",
      });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Action failed", description: err.message });
    } finally {
      setIsSavingSellerAction(false);
    }
  };

  const openEditListingModal = (item: KasuwaItem) => {
    setEditTitle(item.title);
    setEditDescription(item.description);
    setEditPrice(String(item.price));
    setEditLocation(item.location);
    setEditCategory(item.category);
    setEditWhatsapp(item.sellerWhatsapp || "");
    setIsEditingItem(true);
  };

  const handleSaveEditedListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || isSavingSellerAction) return;
    setIsSavingSellerAction(true);
    try {
      const cleanWa = editWhatsapp.replace(/[^0-9]/g, "");
      const updates = {
        title: editTitle.trim(),
        description: editDescription.trim(),
        price: Number(editPrice) || 0,
        location: editLocation.trim(),
        category: editCategory,
        sellerWhatsapp: cleanWa,
      };
      await updateKasuwaItem(selectedItem.id, updates);
      const updated = { ...selectedItem, ...updates };
      setSelectedItem(updated);
      setItems((prev) => prev.map((it) => (it.id === selectedItem.id ? updated : it)));
      setIsEditingItem(false);
      toast({ title: language === "ha" ? "An sabunta bayanan kaya!" : "Listing updated!" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not update listing", description: err.message });
    } finally {
      setIsSavingSellerAction(false);
    }
  };

  const handleDeleteListing = async (item: KasuwaItem) => {
    if (isSavingSellerAction) return;
    setIsSavingSellerAction(true);
    try {
      await deleteKasuwaItem(item.id);
      setItems((prev) => prev.filter((it) => it.id !== item.id));
      setSelectedItem(null);
      toast({ title: language === "ha" ? "An goge kaya daga Kasuwa" : "Listing deleted" });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Could not delete listing", description: err.message });
    } finally {
      setIsSavingSellerAction(false);
    }
  };

  const filteredItems = items.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatCurrency = (amount: number, curr: string) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: curr || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const selectedItemPhotos = selectedItem
    ? selectedItem.imageUrls && selectedItem.imageUrls.length > 0
      ? selectedItem.imageUrls
      : [selectedItem.imageUrl]
    : [];

  return (
    <div className="w-full">
      {/* Kasuwa Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary via-orange-600 to-amber-600 p-6 sm:p-8 text-white shadow-xl mb-8">
        <div className="relative z-10 max-w-2xl">
          <Badge className="bg-white/20 text-white hover:bg-white/30 backdrop-blur-md border-0 mb-3 text-xs px-3 py-1 font-semibold">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" />
            African Peer-to-Peer Trade Hub
          </Badge>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {t("kasuwaTitle")}
          </h1>
          <p className="text-white/90 text-sm sm:text-base leading-relaxed mb-6">
            {t("kasuwaSubtitle")}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setIsListingModalOpen(true)}
              className="bg-white text-primary hover:bg-white/90 font-bold rounded-xl shadow-lg gap-2"
            >
              <PlusCircle className="w-5 h-5" />
              {t("sellItem")}
            </Button>
            <span className="text-xs text-white/80 font-medium">
              ✓ Verified local sellers &middot; Direct WhatsApp chats &middot; 0% Commission
            </span>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-15 pointer-events-none flex items-center justify-center">
          <Store className="w-64 h-64 text-white" />
        </div>
      </div>

      {/* Search and Category Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between mb-6">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products, crops, tech, fabrics..."
            className="pl-10 rounded-xl bg-card border-border shadow-sm text-sm"
          />
        </div>

        {/* Categories Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 hide-scrollbar">
          {categories.map((cat) => (
            <Button
              key={cat.id}
              size="sm"
              variant={selectedCategory === cat.id ? "default" : "outline"}
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id ? "shadow-md" : "hover:bg-muted"
              }`}
            >
              {language === "ha" ? cat.labelHa : cat.labelEn}
            </Button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <Card
              key={item.id}
              onClick={() => {
                setSelectedItem(item);
                setActivePhotoIndex(0);
              }}
              className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      item.isSold ? "opacity-60 grayscale-[35%]" : ""
                    }`}
                  />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className="bg-primary/95 text-primary-foreground font-black text-xs px-2.5 py-1 rounded-lg shadow-md">
                      {formatCurrency(item.price, item.currency)}
                    </span>
                    {item.isSold && (
                      <span className="bg-destructive text-destructive-foreground font-extrabold text-[10px] uppercase tracking-wider px-2 py-1 rounded-lg shadow-md">
                        {language === "ha" ? "AN SAYAR" : "SOLD"}
                      </span>
                    )}
                  </div>
                  {item.imageUrls && item.imageUrls.length > 1 && (
                    <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
                      +{item.imageUrls.length} photos
                    </div>
                  )}
                  <div className="absolute bottom-2.5 left-2.5 right-2.5 flex justify-between items-center pointer-events-none">
                    <span className="bg-black/60 backdrop-blur-md text-white text-[11px] px-2 py-0.5 rounded-md flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-secondary" />
                      <span className="truncate max-w-[140px]">{item.location}</span>
                    </span>
                  </div>
                </div>

                <CardContent className="p-4 pb-2">
                  <h3 className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </div>

              <div className="p-4 pt-0 mt-2 flex items-center justify-between border-t border-border/50 pt-3">
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.sellerAvatarUrl}
                    alt={item.sellerName}
                    className="w-6 h-6 rounded-full object-cover border"
                  />
                  <span className="text-[11px] font-medium text-foreground truncate max-w-[100px]">
                    {item.sellerName}
                  </span>
                </div>
                <Button size="sm" variant="ghost" className="h-8 px-2 text-xs font-semibold text-primary">
                  {t("contactSeller")} &rarr;
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-card rounded-3xl border border-dashed border-border p-8">
          <Store className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-bold">
            {language === "ha" ? "Babu Kayan da aka samu" : "No items found"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto mb-4">
            {language === "ha"
              ? "Zama na farko wajen dora kayanka a Kasuwa!"
              : "Be the first to list products, crafts, or agricultural produce on the marketplace!"}
          </p>
          <Button onClick={() => setIsListingModalOpen(true)} className="rounded-xl font-bold bg-primary text-primary-foreground">
            <PlusCircle className="w-4 h-4 mr-1.5" /> {language === "ha" ? "Saka Kaya" : "List an Item"}
          </Button>
        </div>
      )}

      {/* Item Detail Modal */}
      {selectedItem && (
        <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
          <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden bg-card">
            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative flex flex-col bg-muted">
                <div
                  className="relative aspect-square md:flex-1 w-full bg-muted cursor-zoom-in group"
                  onClick={() => setLightboxOpen(true)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedItemPhotos[activePhotoIndex] || selectedItem.imageUrl}
                    alt={selectedItem.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-80 group-hover:opacity-100 transition-opacity">
                    <Maximize2 className="w-4 h-4" />
                  </div>
                  {selectedItem.isSold && (
                    <div className="absolute top-3 left-3 bg-destructive text-destructive-foreground font-extrabold text-xs px-3 py-1 rounded-lg shadow">
                      {language === "ha" ? "AN SAYAR" : "SOLD"}
                    </div>
                  )}
                </div>

                {selectedItemPhotos.length > 1 && (
                  <div className="flex items-center gap-2 p-2.5 bg-background/90 border-t overflow-x-auto">
                    {selectedItemPhotos.map((photoUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActivePhotoIndex(idx)}
                        className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                          activePhotoIndex === idx ? "border-primary scale-105" : "border-transparent opacity-70"
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-6 flex flex-col justify-between max-h-[85vh] overflow-y-auto">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="text-xs capitalize font-semibold">
                      {selectedItem.category}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setReportingItem(selectedItem)}
                      className="text-xs text-destructive hover:bg-destructive/10 h-7 px-2 rounded-lg gap-1"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" /> Report
                    </Button>
                  </div>

                  <h2 className="text-xl font-bold tracking-tight mb-2 text-foreground">
                    {selectedItem.title}
                  </h2>

                  <div className="text-2xl font-black text-primary mb-4 flex items-center gap-2">
                    <span>{formatCurrency(selectedItem.price, selectedItem.currency)}</span>
                    {selectedItem.isSold && (
                      <Badge variant="destructive" className="text-xs">Sold</Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                    <MapPin className="w-4 h-4 text-primary shrink-0" />
                    <span>{selectedItem.location}</span>
                  </div>

                  <Separator className="my-3" />

                  <p className="text-sm text-foreground/80 leading-relaxed mb-6">
                    {selectedItem.description}
                  </p>
                </div>

                <div className="space-y-3 pt-2">
                  {/* Seller Management Controls if Current User is the Seller */}
                  {currentUser?.uid === selectedItem.sellerUid && (
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                        {language === "ha" ? "Gudanar da Kaya" : "Seller Controls"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant={selectedItem.isSold ? "outline" : "secondary"}
                          onClick={() => handleToggleSold(selectedItem)}
                          disabled={isSavingSellerAction}
                          className="rounded-xl text-xs font-bold gap-1.5 flex-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {selectedItem.isSold ? "Mark Available" : "Mark as Sold"}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditListingModal(selectedItem)}
                          disabled={isSavingSellerAction}
                          className="rounded-xl text-xs font-semibold gap-1"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteListing(selectedItem)}
                          disabled={isSavingSellerAction}
                          className="rounded-xl text-xs font-semibold text-destructive hover:bg-destructive/10 gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3 p-3 bg-muted/60 rounded-2xl">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={selectedItem.sellerAvatarUrl}
                      alt={selectedItem.sellerName}
                      className="w-10 h-10 rounded-full object-cover border"
                    />
                    <div>
                      <p className="text-xs font-bold text-foreground">{selectedItem.sellerName}</p>
                      <p className="text-[11px] text-muted-foreground">Verified Zaure Seller</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      asChild
                      disabled={selectedItem.isSold}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl gap-2 shadow"
                    >
                      <a
                        href={`https://wa.me/${selectedItem.sellerWhatsapp || '2348000000000'}?text=Hello,%20I%20saw%20your%20Zaure%20Connect%20listing:%20${encodeURIComponent(selectedItem.title)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
                      </a>
                    </Button>
                    {selectedItem.sellerPhone && (
                      <Button
                        asChild
                        variant="outline"
                        className="rounded-xl gap-1.5 font-semibold"
                      >
                        <a href={`tel:${selectedItem.sellerPhone}`}>
                          <Phone className="w-4 h-4" /> Call
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Fullscreen Lightbox for Selected Kasuwa Item */}
      <ImageLightbox
        isOpen={lightboxOpen}
        images={selectedItemPhotos}
        initialIndex={activePhotoIndex}
        onClose={() => setLightboxOpen(false)}
        title={selectedItem?.title}
      />

      {/* Seller Edit Listing Modal */}
      <Dialog open={isEditingItem} onOpenChange={setIsEditingItem}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Pencil className="w-4 h-4 text-primary" />
              {language === "ha" ? "Gyara Bayanan Kaya" : "Edit Listing"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveEditedListing} className="space-y-3.5 pt-2">
            <div>
              <label className="text-xs font-semibold block mb-1">Item Title</label>
              <Input
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold block mb-1">Price (₦ Naira)</label>
                <Input
                  required
                  type="number"
                  value={editPrice}
                  onChange={(e) => setEditPrice(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="text-xs font-semibold block mb-1">Location</label>
                <Input
                  required
                  value={editLocation}
                  onChange={(e) => setEditLocation(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">WhatsApp Number</label>
              <Input
                value={editWhatsapp}
                onChange={(e) => setEditWhatsapp(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-semibold block mb-1">Description</label>
              <textarea
                required
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full p-2.5 rounded-xl border bg-background text-sm resize-none"
              />
            </div>
            <DialogFooter className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="rounded-xl" onClick={() => setIsEditingItem(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSavingSellerAction} className="rounded-xl bg-primary text-primary-foreground font-bold">
                {isSavingSellerAction && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* List an item Modal */}
      <Dialog open={isListingModalOpen} onOpenChange={setIsListingModalOpen}>
        <DialogContent className="max-w-lg rounded-3xl p-6 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" />
              {t("sellItem")}
            </DialogTitle>
            <DialogDescription>
              Reach buyers in northern Nigeria and across Africa with 0 commission.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleListItem} className="space-y-4 pt-2">
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Item Title
              </label>
              <Input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Traditional Hausa Shadda Fabric, Kano"
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Price (₦ Naira)
                </label>
                <Input
                  required
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full h-10 px-3 rounded-xl border bg-background text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                >
                  <option value="fashion">Fashion & Clothes</option>
                  <option value="electronics">Phones & Tech</option>
                  <option value="food">Agriculture & Food</option>
                  <option value="handicrafts">Crafts & Arts</option>
                  <option value="services">Services</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  City / Location
                </label>
                <Input
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Kano, Nigeria"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground block mb-1">
                  WhatsApp Contact (with country code)
                </label>
                <Input
                  required
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  placeholder="2348031234567"
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Multi-Photo upload */}
            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Product Photos (Up to 4 images)
              </label>
              {itemImagePreviews.length > 0 && (
                <div className="grid grid-cols-4 gap-2 mb-2">
                  {itemImagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border bg-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removePickedImage(idx)}
                        className="absolute top-1 right-1 bg-black/70 text-white rounded-full p-0.5 hover:bg-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {itemImagePreviews.length < 4 && (
                <div className="grid grid-cols-2 gap-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border/80 rounded-2xl p-3.5 text-center cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <ImageIcon className="w-5 h-5 text-primary mb-1" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {language === "ha" ? "Zabi Daga Hotuna" : "Upload Gallery"}
                      </span>
                    </div>
                  </div>
                  <div
                    onClick={() => setIsKasuwaCameraOpen(true)}
                    className="border-2 border-dashed border-emerald-500/40 rounded-2xl p-3.5 text-center cursor-pointer hover:bg-emerald-500/10 transition-colors"
                  >
                    <div className="flex flex-col items-center">
                      <Camera className="w-5 h-5 text-emerald-500 mb-1" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {language === "ha" ? "Dauki Hoto (Kamara)" : "Take Photo"}
                      </span>
                    </div>
                  </div>
                  <input
                    type="file"
                    multiple
                    ref={fileInputRef}
                    onChange={handleImagePick}
                    accept="image/*"
                    className="hidden"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-foreground block mb-1">
                Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                placeholder="Item condition, delivery options, etc."
                className="w-full p-2.5 rounded-xl border bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsListingModalOpen(false)} disabled={isPublishing}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPublishing} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl">
                {isPublishing && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                Publish Listing
              </Button>
            </div>
          </form>

          <CameraCaptureModal
            isOpen={isKasuwaCameraOpen}
            onClose={() => setIsKasuwaCameraOpen(false)}
            onCapture={(file) => {
              const combined = [...itemImageFiles, file].slice(0, 4);
              setItemImageFiles(combined);
              setItemImagePreviews(combined.map((f) => URL.createObjectURL(f)));
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Reporting Modal */}
      {reportingItem && (
        <ReportDialog
          isOpen={!!reportingItem}
          onClose={() => setReportingItem(null)}
          targetId={reportingItem.id}
          targetType="kasuwa_item"
          targetTitle={reportingItem.title}
        />
      )}
    </div>
  );
}

