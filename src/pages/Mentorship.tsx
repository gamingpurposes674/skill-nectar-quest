import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Search,
  Plus,
  MessageCircle,
  Send,
  Check,
  X,
  ArrowLeft,
  Clock,
  Users,
  Sparkles,
} from "lucide-react";
import TopNav from "@/components/TopNav";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toTitleCase } from "@/lib/textValidation";

const EXPERTISE_OPTIONS = [
  "Computer Science",
  "Engineering",
  "Business",
  "Medicine",
  "Law",
  "Arts & Design",
  "Research",
  "Data Science",
  "Marketing",
  "Finance",
  "Writing",
  "Public Speaking",
  "College Applications",
  "SAT/ACT Prep",
  "Internship Guidance",
];

const Mentorship = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mentors, setMentors] = useState<any[]>([]);
  const [myMentorProfile, setMyMentorProfile] = useState<any>(null);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const [incomingRequests, setIncomingRequests] = useState<any[]>([]);
  const [acceptedMentorships, setAcceptedMentorships] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterExpertise, setFilterExpertise] = useState("All");

  // Mentor profile form
  const [showCreateMentor, setShowCreateMentor] = useState(false);
  const [mentorBio, setMentorBio] = useState("");
  const [mentorExpertise, setMentorExpertise] = useState<string[]>([]);
  const [mentorAvailability, setMentorAvailability] = useState("Open");

  // Chat
  const [activeChatRequest, setActiveChatRequest] = useState<any>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Realtime subscription for chat
  useEffect(() => {
    if (!activeChatRequest) return;
    const channel = supabase
      .channel(`mentorship-chat-${activeChatRequest.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mentorship_messages",
          filter: `mentorship_id=eq.${activeChatRequest.id}`,
        },
        (payload) => {
          setChatMessages((prev) => [...prev, payload.new]);
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeChatRequest]);

  const loadData = async () => {
    try {
      const [
        { data: profileData },
        { data: mentorData },
        { data: myMentorData },
        { data: sentRequests },
        { data: receivedRequests },
      ] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", user!.id).single(),
        supabase.from("mentor_profiles").select("*"),
        supabase.from("mentor_profiles").select("*").eq("user_id", user!.id).maybeSingle(),
        supabase
          .from("mentorship_requests")
          .select("*")
          .eq("mentee_id", user!.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("mentorship_requests")
          .select("*")
          .eq("mentor_id", user!.id)
          .order("created_at", { ascending: false }),
      ]);

      setProfile(profileData);
      setMyMentorProfile(myMentorData);

      // Load profiles for all mentors
      if (mentorData && mentorData.length > 0) {
        const mentorUserIds = mentorData.map((m: any) => m.user_id);
        const { data: mentorProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, grade, school, skills, major")
          .in("id", mentorUserIds);

        const profileMap = new Map(
          (mentorProfiles || []).map((p: any) => [p.id, p])
        );
        setMentors(
          mentorData
            .filter((m: any) => m.user_id !== user!.id)
            .map((m: any) => ({
              ...m,
              profile: profileMap.get(m.user_id),
            }))
        );
      }

      // Process requests
      const allRequests = [...(sentRequests || []), ...(receivedRequests || [])];
      const requestUserIds = new Set<string>();
      allRequests.forEach((r) => {
        requestUserIds.add(r.mentor_id);
        requestUserIds.add(r.mentee_id);
      });

      let requestProfileMap = new Map();
      if (requestUserIds.size > 0) {
        const { data: reqProfiles } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url")
          .in("id", Array.from(requestUserIds));
        requestProfileMap = new Map(
          (reqProfiles || []).map((p: any) => [p.id, p])
        );
      }

      const enrichRequest = (r: any) => ({
        ...r,
        mentorProfile: requestProfileMap.get(r.mentor_id),
        menteeProfile: requestProfileMap.get(r.mentee_id),
      });

      setMyRequests((sentRequests || []).map(enrichRequest));
      setIncomingRequests(
        (receivedRequests || []).filter((r: any) => r.status === "pending").map(enrichRequest)
      );
      setAcceptedMentorships(
        allRequests
          .filter((r: any) => r.status === "accepted")
          .map(enrichRequest)
          // deduplicate by id
          .filter((r, i, arr) => arr.findIndex((x: any) => x.id === r.id) === i)
      );

      // Pre-fill mentor form if editing
      if (myMentorData) {
        setMentorBio(myMentorData.bio || "");
        setMentorExpertise(myMentorData.expertise || []);
        setMentorAvailability(myMentorData.availability || "Open");
      }
    } catch (error) {
      console.error("Error loading mentorship data:", error);
      toast.error("Failed to load mentorship data");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMentorProfile = async () => {
    if (mentorExpertise.length === 0) {
      toast.error("Please select at least one area of expertise");
      return;
    }

    try {
      if (myMentorProfile) {
        const { error } = await supabase
          .from("mentor_profiles")
          .update({
            expertise: mentorExpertise,
            availability: mentorAvailability,
            bio: mentorBio,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user!.id);
        if (error) throw error;
        toast.success("Mentor profile updated!");
      } else {
        const { error } = await supabase.from("mentor_profiles").insert({
          user_id: user!.id,
          expertise: mentorExpertise,
          availability: mentorAvailability,
          bio: mentorBio,
        });
        if (error) throw error;
        toast.success("You're now a mentor!");
      }
      setShowCreateMentor(false);
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to save mentor profile");
    }
  };

  const handleRequestMentorship = async (mentorUserId: string) => {
    try {
      // Check existing
      const existing = myRequests.find(
        (r) => r.mentor_id === mentorUserId && r.status !== "rejected"
      );
      if (existing) {
        toast.error("You already have a request with this mentor");
        return;
      }

      const { error } = await supabase.from("mentorship_requests").insert({
        mentor_id: mentorUserId,
        mentee_id: user!.id,
        message: "I'd love to learn from you!",
        status: "pending",
      });
      if (error) throw error;

      // Send notification
      await supabase.from("notifications").insert({
        user_id: mentorUserId,
        from_user_id: user!.id,
        type: "mentorship_request",
        title: "New Mentorship Request",
        message: `${profile?.full_name || "Someone"} wants you as their mentor`,
      });

      toast.success("Mentorship request sent!");
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send request");
    }
  };

  const handleRespondToRequest = async (
    requestId: string,
    action: "accepted" | "rejected",
    menteeId: string
  ) => {
    try {
      const { error } = await supabase
        .from("mentorship_requests")
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq("id", requestId);
      if (error) throw error;

      await supabase.from("notifications").insert({
        user_id: menteeId,
        from_user_id: user!.id,
        type: "mentorship_response",
        title: `Mentorship ${action === "accepted" ? "Accepted" : "Declined"}`,
        message:
          action === "accepted"
            ? `${profile?.full_name} accepted your mentorship request!`
            : `${profile?.full_name} declined your mentorship request`,
      });

      toast.success(
        action === "accepted" ? "Mentorship accepted!" : "Request declined"
      );
      loadData();
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to respond");
    }
  };

  const openChat = async (request: any) => {
    setActiveChatRequest(request);
    const { data } = await supabase
      .from("mentorship_messages")
      .select("*")
      .eq("mentorship_id", request.id)
      .order("created_at", { ascending: true });
    setChatMessages(data || []);
  };

  const sendChatMessage = async () => {
    if (!newMessage.trim() || !activeChatRequest || sendingMessage) return;
    setSendingMessage(true);
    try {
      const { error } = await supabase.from("mentorship_messages").insert({
        mentorship_id: activeChatRequest.id,
        sender_id: user!.id,
        message: newMessage.trim(),
      });
      if (error) throw error;
      setNewMessage("");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to send message");
    } finally {
      setSendingMessage(false);
    }
  };

  const filteredMentors = mentors.filter((m) => {
    const matchesSearch =
      !searchQuery ||
      m.profile?.full_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      m.expertise?.some((e: string) =>
        e.toLowerCase().includes(searchQuery.toLowerCase())
      );
    const matchesExpertise =
      filterExpertise === "All" || m.expertise?.includes(filterExpertise);
    return matchesSearch && matchesExpertise;
  });

  const getOtherPerson = (request: any) => {
    if (request.mentor_id === user?.id) return request.menteeProfile;
    return request.mentorProfile;
  };

  const getRole = (request: any) => {
    return request.mentor_id === user?.id ? "Mentor" : "Mentee";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <TopNav profile={null} />
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="min-h-screen bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="glow-orb w-96 h-96 bg-secondary/15 -top-48 -left-48 fixed" />
      <div className="glow-orb w-72 h-72 bg-primary/10 top-1/3 -right-36 fixed" />

      <TopNav profile={profile} />

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1
                className="text-2xl md:text-3xl font-bold text-foreground"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                Mentorship
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Connect with experienced mentors or guide the next generation
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCreateMentor(true)}
            className="bg-gradient-to-r from-secondary to-primary text-primary-foreground gap-2"
          >
            {myMentorProfile ? (
              <>
                <Sparkles className="h-4 w-4" /> Edit Mentor Profile
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" /> Become A Mentor
              </>
            )}
          </Button>
        </div>

        <Tabs defaultValue="browse">
          <TabsList className="bg-muted/50 backdrop-blur-sm p-1 rounded-xl border border-border/40 mb-6">
            <TabsTrigger
              value="browse"
              className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
            >
              <Search className="h-4 w-4 mr-1.5" />
              Browse Mentors
            </TabsTrigger>
            <TabsTrigger
              value="my"
              className="rounded-lg text-xs sm:text-sm data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground transition-all"
            >
              <Users className="h-4 w-4 mr-1.5" />
              My Mentorships
              {(incomingRequests.length > 0) && (
                <span className="ml-1.5 bg-destructive text-destructive-foreground text-[10px] rounded-full px-1.5 py-0.5">
                  {incomingRequests.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Browse Mentors */}
          <TabsContent value="browse">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search mentors by name or expertise..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-muted/50 border-border/50"
                />
              </div>
              <Select
                value={filterExpertise}
                onValueChange={setFilterExpertise}
              >
                <SelectTrigger className="w-full sm:w-[200px] bg-muted/50 border-border/50">
                  <SelectValue placeholder="Expertise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Expertise</SelectItem>
                  {EXPERTISE_OPTIONS.map((e) => (
                    <SelectItem key={e} value={e}>
                      {e}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredMentors.length === 0 ? (
              <div className="text-center py-16">
                <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No mentors found. Be the first to become a mentor!
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredMentors.map((mentor) => (
                  <AnimatedCard
                    key={mentor.id}
                    className="glass-card shadow-card p-5"
                  >
                    <div className="flex items-start gap-4">
                      <Avatar
                        className="h-12 w-12 cursor-pointer ring-2 ring-border hover:ring-secondary/50 transition-all"
                        onClick={() =>
                          navigate(`/profile/${mentor.user_id}`)
                        }
                      >
                        <AvatarImage
                          src={mentor.profile?.avatar_url || ""}
                        />
                        <AvatarFallback>
                          {mentor.profile?.full_name?.[0] || "M"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3
                            className="font-bold text-foreground truncate cursor-pointer hover:text-secondary transition-colors"
                            onClick={() =>
                              navigate(`/profile/${mentor.user_id}`)
                            }
                          >
                            {mentor.profile?.full_name || "Mentor"}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="bg-secondary/15 text-secondary border-secondary/20 text-[10px]"
                          >
                            {mentor.availability}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {mentor.profile?.grade || "Student"} •{" "}
                          {mentor.profile?.school || ""}
                        </p>
                        {mentor.bio && (
                          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                            {mentor.bio}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {mentor.expertise?.map((exp: string) => (
                            <Badge
                              key={exp}
                              variant="outline"
                              className="text-[10px] border-border/40"
                            >
                              {exp}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          size="sm"
                          className="mt-3 gap-1.5 bg-secondary/15 text-secondary hover:bg-secondary/25 border border-secondary/20"
                          variant="ghost"
                          onClick={() =>
                            handleRequestMentorship(mentor.user_id)
                          }
                        >
                          <GraduationCap className="h-3.5 w-3.5" />
                          Request Mentorship
                        </Button>
                      </div>
                    </div>
                  </AnimatedCard>
                ))}
              </div>
            )}
          </TabsContent>

          {/* My Mentorships */}
          <TabsContent value="my" className="space-y-6">
            {/* Incoming Requests */}
            {incomingRequests.length > 0 && (
              <div>
                <h3
                  className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  <Clock className="h-4 w-4 text-yellow-400" />
                  Pending Requests
                </h3>
                <div className="space-y-3">
                  {incomingRequests.map((req) => (
                    <AnimatedCard
                      key={req.id}
                      className="glass-card shadow-card p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={req.menteeProfile?.avatar_url || ""}
                            />
                            <AvatarFallback>
                              {req.menteeProfile?.full_name?.[0] || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {req.menteeProfile?.full_name || "Student"}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {req.message || "Wants to learn from you"}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            className="bg-accent/15 text-accent hover:bg-accent/25 gap-1"
                            variant="ghost"
                            onClick={() =>
                              handleRespondToRequest(
                                req.id,
                                "accepted",
                                req.mentee_id
                              )
                            }
                          >
                            <Check className="h-3.5 w-3.5" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10 gap-1"
                            onClick={() =>
                              handleRespondToRequest(
                                req.id,
                                "rejected",
                                req.mentee_id
                              )
                            }
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </AnimatedCard>
                  ))}
                </div>
              </div>
            )}

            {/* Active Mentorships */}
            <div>
              <h3
                className="text-sm font-bold text-foreground mb-3 flex items-center gap-2"
                style={{ fontFamily: "'Space Grotesk', sans-serif" }}
              >
                <MessageCircle className="h-4 w-4 text-accent" />
                Active Mentorships
              </h3>
              {acceptedMentorships.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground">
                    No active mentorships yet
                  </p>
                </div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {acceptedMentorships.map((req) => {
                    const other = getOtherPerson(req);
                    const role = getRole(req);
                    return (
                      <AnimatedCard
                        key={req.id}
                        className="glass-card shadow-card p-4"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar className="h-9 w-9">
                              <AvatarImage
                                src={other?.avatar_url || ""}
                              />
                              <AvatarFallback>
                                {other?.full_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {other?.full_name || "User"}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                You are the {role}
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 bg-accent/10 text-accent hover:bg-accent/20"
                            onClick={() => openChat(req)}
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            Chat
                          </Button>
                        </div>
                      </AnimatedCard>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sent Requests (pending) */}
            {myRequests.filter((r) => r.status === "pending").length > 0 && (
              <div>
                <h3
                  className="text-sm font-bold text-foreground mb-3"
                  style={{ fontFamily: "'Space Grotesk', sans-serif" }}
                >
                  Sent Requests
                </h3>
                <div className="space-y-2">
                  {myRequests
                    .filter((r) => r.status === "pending")
                    .map((req) => (
                      <div
                        key={req.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-muted/30 border border-border/30"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={req.mentorProfile?.avatar_url || ""}
                          />
                          <AvatarFallback>
                            {req.mentorProfile?.full_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground truncate">
                            {req.mentorProfile?.full_name || "Mentor"}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] text-yellow-400 border-yellow-400/30"
                        >
                          Pending
                        </Badge>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create/Edit Mentor Profile Dialog */}
      <Dialog open={showCreateMentor} onOpenChange={setShowCreateMentor}>
        <DialogContent className="sm:max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {myMentorProfile ? "Edit Mentor Profile" : "Become A Mentor"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Areas Of Expertise
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERTISE_OPTIONS.map((exp) => (
                  <Badge
                    key={exp}
                    variant={
                      mentorExpertise.includes(exp) ? "default" : "outline"
                    }
                    className={`cursor-pointer text-[11px] transition-all ${
                      mentorExpertise.includes(exp)
                        ? "bg-secondary text-secondary-foreground"
                        : "border-border/40 hover:border-secondary/40"
                    }`}
                    onClick={() => {
                      setMentorExpertise((prev) =>
                        prev.includes(exp)
                          ? prev.filter((e) => e !== exp)
                          : [...prev, exp]
                      );
                    }}
                  >
                    {exp}
                  </Badge>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Availability
              </label>
              <Select
                value={mentorAvailability}
                onValueChange={setMentorAvailability}
              >
                <SelectTrigger className="bg-muted/50 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Open">Open — Accepting Mentees</SelectItem>
                  <SelectItem value="Limited">
                    Limited — Few Spots Left
                  </SelectItem>
                  <SelectItem value="Closed">
                    Closed — Not Accepting
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Mentor Bio
              </label>
              <Textarea
                placeholder="Share your experience, what you can help with, and your mentoring style..."
                value={mentorBio}
                onChange={(e) => setMentorBio(e.target.value)}
                className="bg-muted/50 border-border/50 min-h-[100px]"
                maxLength={500}
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">
                {mentorBio.length}/500
              </p>
            </div>

            <Button
              onClick={handleSaveMentorProfile}
              className="w-full bg-gradient-to-r from-secondary to-primary"
            >
              {myMentorProfile ? "Save Changes" : "Create Mentor Profile"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Chat Dialog */}
      <Dialog
        open={!!activeChatRequest}
        onOpenChange={(open) => {
          if (!open) setActiveChatRequest(null);
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border/50 flex flex-col max-h-[80vh]">
          <DialogHeader>
            <DialogTitle
              className="flex items-center gap-2"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              <MessageCircle className="h-5 w-5 text-accent" />
              Chat With{" "}
              {activeChatRequest
                ? getOtherPerson(activeChatRequest)?.full_name || "Mentor"
                : ""}
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-3 py-4 min-h-[300px] max-h-[400px]">
            {chatMessages.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">
                No messages yet. Say hello!
              </p>
            ) : (
              chatMessages.map((msg: any) => {
                const isMe = msg.sender_id === user?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-xl text-sm ${
                        isMe
                          ? "bg-secondary/20 text-foreground rounded-br-sm"
                          : "bg-muted/50 text-foreground rounded-bl-sm"
                      }`}
                    >
                      <p>{msg.message}</p>
                      <p className="text-[9px] text-muted-foreground mt-1">
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          <div className="flex gap-2 pt-2 border-t border-border/30">
            <Input
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendChatMessage();
                }
              }}
              className="bg-muted/50 border-border/50"
            />
            <Button
              size="icon"
              onClick={sendChatMessage}
              disabled={!newMessage.trim() || sendingMessage}
              className="bg-secondary hover:bg-secondary/80 flex-shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default Mentorship;
