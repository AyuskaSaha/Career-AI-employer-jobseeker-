'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Wand2, Save, Users, Code, Trash2, CalendarIcon, FileText, Check, X, ChevronsUpDown } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { generateJobPosting, type JobPostingInput } from '@/ai/flows/ai-job-posting-generator';
import { rankResumes, type RankResumesOutput } from '@/ai/flows/top-resume-ranking';
import { type AnalyzeResumeShortcomingsOutput } from '@/ai/flows/resume-shortcoming-analysis';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { format } from 'date-fns';
import { useJobs, type AppJobPosting } from '@/app/job-context';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import withAuth from '@/components/withAuth';

const demoRankedResumes: RankResumesOutput = [];

function JobPostingGenerator({ onJobSaved }: { onJobSaved: (newPosting: AppJobPosting) => void }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Omit<JobPostingInput, 'userProfileId'>>>({ jobType: 'Full-time' });
  const [generatedPosting, setGeneratedPosting] = useState<string>('');
  const [refinement, setRefinement] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (value: JobPostingInput['jobType']) => {
    setFormData(prev => ({ ...prev, jobType: value }));
  };
  
  const canGenerate = () => {
    const { jobTitle, companyName, location, description, responsibilities, mustHaveSkills } = formData;
    return jobTitle && companyName && location && description && responsibilities && mustHaveSkills;
  };

  const handleGenerate = async (isRefinement = false) => {
    if (!canGenerate()) {
      setError("Please fill out all required fields.");
      return;
    }
    setLoading(true);
    setError(null);
    
    if(!isRefinement) {
      setGeneratedPosting('');
    }

    try {
      const userId = 'anonymous-user'; 
      const input: JobPostingInput = {
        ...formData as Omit<JobPostingInput, 'userProfileId' | 'refinement' | 'previousPosting'>,
        userProfileId: userId,
        ...(isRefinement && { refinement, previousPosting: generatedPosting })
      };
      
      const result = await generateJobPosting(input);
      setGeneratedPosting(result);

    } catch (e: any) {
      console.error(e);
      setError(e.message || `Failed to ${isRefinement ? 'refine' : 'generate'} job posting. Please try again.`);
      setGeneratedPosting('');
    } finally {
        setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!generatedPosting) {
      toast({ variant: 'destructive', title: 'Error', description: 'Cannot save an empty posting.'});
      return;
    }
    
    setSaving(true);
    const userId = 'anonymous-user';

    try {
        const newPosting: AppJobPosting = {
            id: `job-${Date.now()}`,
            userProfileId: userId,
            jobTitle: formData.jobTitle || 'Untitled Job',
            companyName: formData.companyName || 'Untitled Company',
            location: formData.location || 'Remote',
            description: generatedPosting.split('\n')[0],
            jobPostingText: generatedPosting,
            status: 'active',
            createdAt: new Date(),
            expiresAt: null,
        };
        
        onJobSaved(newPosting);
        
        toast({
          title: "Job Posting Saved!",
          description: "Your new job posting has been created.",
        });

    } catch (error) {
        console.error("Error creating job posting: ", error);
        toast({
            variant: "destructive",
            title: "Save Failed",
            description: "Could not create the job posting.",
        });
    } finally {
        setSaving(false);
    }
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">AI Job Posting Generator</CardTitle>
        <CardDescription>Fill in the details below, and let our AI craft the perfect job posting. You can then refine it with further instructions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="jobTitle">Job Title</Label>
            <Input id="jobTitle" placeholder="e.g., Senior Frontend Developer" value={formData.jobTitle || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input id="companyName" placeholder="e.g., Acme Inc." value={formData.companyName || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input id="location" placeholder="e.g., San Francisco, CA or Remote" value={formData.location || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryRange">Salary Range (Optional)</Label>
            <Input id="salaryRange" placeholder="e.g., $120,000 - $150,000" value={formData.salaryRange || ''} onChange={handleInputChange} disabled={loading}/>
          </div>
          <div className="space-y-2">
            <Label htmlFor="jobType">Job Type</Label>
             <Select value={formData.jobType} onValueChange={handleSelectChange} disabled={loading}>
              <SelectTrigger id="jobType">
                <SelectValue placeholder="Select job type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Full-time">Full-time</SelectItem>
                <SelectItem value="Part-time">Part-time</SelectItem>
                <SelectItem value="Contract">Contract</SelectItem>
                <SelectItem value="Internship">Internship</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="description">Company &amp; Role Description</Label>
          <Textarea id="description" placeholder="Describe your company's mission, culture, and the role's purpose." className="min-h-[100px]" value={formData.description || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="responsibilities">Responsibilities</Label>
          <Textarea id="responsibilities" placeholder="List the key responsibilities, e.g., - Develop and maintain web applications..." className="min-h-[120px]" value={formData.responsibilities || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="mustHaveSkills">Must-Have Skills</Label>
          <Input id="mustHaveSkills" placeholder="Comma-separated, e.g., React, TypeScript, CSS" value={formData.mustHaveSkills || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        <div className="space-y-2">
          <Label htmlFor="niceToHaveSkills">Nice-to-Have Skills (Optional)</Label>
          <Input id="niceToHaveSkills" placeholder="Comma-separated, e.g., GraphQL, Docker, AWS" value={formData.niceToHaveSkills || ''} onChange={handleInputChange} disabled={loading}/>
        </div>
        
        {!generatedPosting && !loading && (
          <Button onClick={() => handleGenerate(false)} disabled={loading || !canGenerate()}>
            <Sparkles className="mr-2 h-4 w-4" />
            Generate Job Posting
          </Button>
        )}
        
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {(generatedPosting || loading) && (
          <div className="space-y-4 pt-4 border-t mt-4">
             <div className="space-y-2">
              <Label className="font-semibold text-lg">Generated Job Posting</Label>
               {loading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin"/>AI is generating...</div>}
              <Textarea readOnly value={generatedPosting} className="min-h-[400px] bg-muted/50 font-sans" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="refinement">Refine the Posting (Optional)</Label>
              <Textarea id="refinement" placeholder="e.g., 'Make the tone more casual' or 'Add a section about company benefits.'" className="min-h-[60px]" value={refinement} onChange={(e) => setRefinement(e.target.value)} disabled={loading} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={() => handleGenerate(true)} disabled={loading || !refinement}>
                {loading && refinement ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
                Refine Posting
              </Button>
              <Button onClick={handleSave} variant="outline" disabled={loading || saving || !generatedPosting}>
                 {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Posting
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ShortcomingAnalysis({ analysis }: { analysis: Pick<AnalyzeResumeShortcomingsOutput, 'shortcomings' | 'overallAssessment'> }) {

  const getSeverityBadge = (severity: 'critical' | 'high' | 'moderate' | 'low') => {
    switch(severity) {
      case 'critical': return <Badge variant="destructive">Critical</Badge>;
      case 'high': return <Badge variant="destructive" className="bg-orange-500 hover:bg-orange-500/80">High</Badge>;
      case 'moderate': return <Badge variant="secondary" className="bg-yellow-400 text-black hover:bg-yellow-400/80">Moderate</Badge>;
      case 'low': return <Badge variant="secondary" className="bg-green-400 text-black hover:bg-green-400/80">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  }

  return (
    <div className="mt-4 rounded-md border bg-card/50 p-4">
      <div className="space-y-4">
        <h4 className="font-semibold">Gap Analysis</h4>
        <div className="space-y-2">
          <h5 className="font-medium text-sm">Overall Assessment</h5>
          <p className="text-sm text-muted-foreground">{analysis.overallAssessment}</p>
        </div>
          {analysis.shortcomings.length > 0 && (
            <div className="space-y-2">
            <h5 className="font-medium text-sm">Identified Shortcomings</h5>
              <Accordion type="single" collapsible className="w-full" defaultValue="item-0">
              {analysis.shortcomings.map((item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger>
                    <div className="flex items-center gap-2 text-left">
                      {getSeverityBadge(item.severity)}
                      <span className="font-medium">{item.skill}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-2 text-sm">
                    <p><strong className="text-foreground/80">Impact:</strong> {item.impact}</p>
                    <p><strong className="text-foreground/80">Mitigation:</strong> {item.mitigation}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
          )}
      </div>
    </div>
  )
}

function ResumeRanker({ jobPostings, onJobDelete, onJobUpdate }: { jobPostings: AppJobPosting[]; onJobDelete: (jobId: string) => void; onJobUpdate: (jobId: string, updates: Partial<Pick<AppJobPosting, 'status' | 'expiresAt'>>) => void; }) {
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<AppJobPosting | null>(null);
  const [rankedResumes, setRankedResumes] = useState<RankResumesOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<number, 'Accepted' | 'Rejected'>>({});
  const rankingImage = PlaceHolderImages.find(img => img.id === 'resume-ranking');
  const { toast } = useToast();

  const handleRank = async (job: AppJobPosting) => {
    if (job.status === 'inactive') return;
    setSelectedJob(job);
    setLoading(true);
    setError(null);
    setRankedResumes(null);
    setDecisions({});
    try {
      const result = await rankResumes({ jobDescription: job.jobPostingText });
      setRankedResumes(result.length > 0 ? result : demoRankedResumes); // Fallback to demo data
    } catch (e: any) {
      console.error(e);
      // Fallback to demo data on error for a better demo experience
      setRankedResumes(demoRankedResumes);
      setError(e.message || "Failed to rank resumes. Showing demo data.");
    } finally {
        setLoading(false);
    }
  };

  const handleDecision = (rank: number, candidateName: string, candidateEmail: string, decision: 'Accepted' | 'Rejected') => {
    setDecisions(prev => ({ ...prev, [rank]: decision }));
    toast({
      title: `Candidate ${decision}`,
      description: `${candidateName} has been ${decision.toLowerCase()}`,
    });

    if (decision === 'Accepted') {
      draftAcceptanceEmail(candidateName, candidateEmail);
    }
  };

  const draftAcceptanceEmail = (candidateName: string, candidateEmail: string) => {
    const subject = `Congratulations on Your Job Offer from ${selectedJob?.companyName}`;
    const body = `Dear ${candidateName},

We are thrilled to offer you the position of ${selectedJob?.jobTitle} at ${selectedJob?.companyName}. We were very impressed with your qualifications and experience, and we believe you would be a great asset to our team.

We would like to offer you a starting salary of [Salary] and a start date of [Start Date]. Please find attached the official offer letter with more details about the role, benefits, and our company.

We are very excited about the possibility of you joining our team. Please let us know if you have any questions.

Best regards,
The ${selectedJob?.companyName} Team`;

    window.location.href = `mailto:${candidateEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleDelete = (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    onJobDelete(jobId);
  }

  const handleStatusChange = (jobId: string, newStatus: boolean) => {
    onJobUpdate(jobId, { status: newStatus ? 'active' : 'inactive' });
  };
  
  const handleDateChange = (jobId: string, date: Date | undefined) => {
      onJobUpdate(jobId, { expiresAt: date || undefined });
  };
  
  const getIconForJob = (title: string) => {
    if (title.toLowerCase().includes('developer') || title.toLowerCase().includes('engineer')) {
      return <Code className="h-8 w-8" />;
    }
    if (title.toLowerCase().includes('manager')) {
      return <Users className="h-8 w-8" />;
    }
    return <Users className="h-8 w-8" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Top Resume Ranker</CardTitle>
        <CardDescription>Select a job posting to automatically find and rank the top candidates from our talent pool.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {!selectedJob ? (
           <div className="grid md:grid-cols-2 gap-4">
            {jobPostings.map(job => (
              <Card 
                key={job.id} 
                className={cn(
                  "cursor-pointer hover:shadow-md transition-all group relative",
                  job.status === 'active' ? 'hover:border-primary' : 'bg-muted/50 cursor-not-allowed'
                )}
                onClick={() => handleRank(job)}
              >
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className={cn("p-3 rounded-full", job.status === 'active' ? 'bg-primary/10 text-primary' : 'bg-muted-foreground/10 text-muted-foreground')}>
                      {getIconForJob(job.jobTitle)}
                    </div>
                    <div>
                      <CardTitle className="text-xl">{job.jobTitle}</CardTitle>
                      <CardDescription className="mt-1 line-clamp-2">{job.description}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className='flex items-center space-x-2'>
                        <Switch
                          id={`status-${job.id}`}
                          checked={job.status === 'active'}
                          onCheckedChange={(checked) => handleStatusChange(job.id, checked)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <Label htmlFor={`status-${job.id}`} onClick={(e) => e.stopPropagation()}>
                          <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                            {job.status === 'active' ? 'Active' : 'Inactive'}
                          </Badge>
                        </Label>
                      </div>
                       {job.status === 'active' && (
                        <Button variant="destructive" size="sm" onClick={(e) => { e.stopPropagation(); handleStatusChange(job.id, false); }}>
                          Deactivate
                        </Button>
                      )}
                    </div>
                     <div className="flex items-center space-x-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] justify-start text-left font-normal",
                                !job.expiresAt && "text-muted-foreground"
                              )}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {job.expiresAt ? format(job.expiresAt, "PPP") : <span>Set expiration date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start" onClick={(e) => e.stopPropagation()}>
                            <Calendar
                              mode="single"
                              selected={job.expiresAt || undefined}
                              onSelect={(date) => handleDateChange(job.id, date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                  </div>
                </CardContent>
                <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => handleDelete(e, job.id)}>
                  <Trash2 className="h-4 w-4"/>
                </Button>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            <Button variant="outline" onClick={() => { setSelectedJob(null); setRankedResumes(null); }}>&larr; Back to Job Postings</Button>
          </div>
        )}

        {loading && <div className="flex items-center gap-2 pt-4"><Loader2 className="h-5 w-5 animate-spin" /> <p className="text-sm text-muted-foreground animate-pulse">Searching and ranking candidates, this may take a moment...</p></div>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        
        {!rankedResumes && !loading && !error && !selectedJob && rankingImage && (
          <div className="pt-8 text-center">
             <div className="relative aspect-video max-w-lg mx-auto w-full overflow-hidden rounded-lg">
                <Image src={rankingImage.imageUrl} alt={rankingImage.description} fill className="object-cover" data-ai-hint={rankingImage.imageHint}/>
              </div>
            <p className="mt-4 text-muted-foreground">Your top candidates will appear here.</p>
          </div>
        )}

        {rankedResumes && selectedJob && (
          <div className="space-y-4 pt-4">
            <h3 className="text-lg font-semibold font-headline">Top Ranked Candidates for: <span className="text-primary">{selectedJob.jobTitle}</span></h3>
            <div className="space-y-4">
              {rankedResumes.map(item => {
                const candidateName = item.resume.match(/Name: (.*)/)?.[1] || 'Unknown Candidate';
                const candidateEmail = item.resume.match(/Email: (.*)/)?.[1] || '';
                const decision = decisions[item.rank];
                return (
                  <Collapsible key={item.rank} asChild>
                    <Card className={cn("p-4 transition-all",
                      decision === 'Accepted' && 'border-2 border-green-500',
                      decision === 'Rejected' && 'border-2 border-destructive'
                    )}>
                      <div className="flex items-start gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-lg flex-shrink-0">{item.rank}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold">Reasoning for Rank</h4>
                          <p className="text-sm text-muted-foreground mb-2">{item.reason}</p>
                          
                          <div className="p-4 border rounded-md bg-muted/20">
                            <h5 className="font-medium mb-2">Resume Snippet</h5>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap font-sans">{item.resume}</p>
                          </div>
    
                          <CollapsibleContent className="collapsible-content">
                            <ShortcomingAnalysis analysis={{ shortcomings: item.shortcomings, overallAssessment: item.overallAssessment }} />
                          </CollapsibleContent>
    
                          <div className="flex flex-wrap gap-2 mt-4">
                              <CollapsibleTrigger asChild>
                                  <Button variant="outline" size="sm">
                                      <ChevronsUpDown className="mr-2 h-4 w-4" />
                                      Show Gap Analysis
                                  </Button>
                              </CollapsibleTrigger>
                            {!decision && (
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => handleDecision(item.rank, candidateName, candidateEmail, 'Accepted')} className="bg-green-600 hover:bg-green-700">
                                  <Check className="mr-2 h-4 w-4" />
                                  Accept
                                </Button>
                                <Button size="sm" variant="destructive" onClick={() => handleDecision(item.rank, candidateName, candidateEmail, 'Rejected')}>
                                  <X className="mr-2 h-4 w-4" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Collapsible>
              )})}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PreviousPostings({ jobPostings, onDelete }: { jobPostings: AppJobPosting[], onDelete: (id: string) => void }) {

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Previous Job Postings</CardTitle>
        <CardDescription>View and manage your previously generated job postings.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobPostings.length === 0 && (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't generated any job postings yet.</p>
          </div>
        )}
        {jobPostings.length > 0 && (
          <div className="space-y-4">
            {jobPostings.map((posting) => (
              <Card key={posting.id} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                       <h4 className="font-semibold text-lg">{posting.jobTitle}</h4>
                       <Badge variant={posting.status === 'active' ? 'default' : 'secondary'}>{posting.status}</Badge>
                    </div>
                     <p className="text-sm text-muted-foreground">
                        at {posting.companyName} &bull; Created on {format(new Date(posting.createdAt), "PPP")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                     <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(posting.jobPostingText)}>Copy Text</Button>
                      <Button variant="destructive" size="icon" onClick={() => onDelete(posting.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmployerPage() {
  const [activeTab, setActiveTab] = useState("generator");
  const { jobs, addJob, updateJob, deleteJob } = useJobs();
  const { toast } = useToast();

  const handleJobSaved = (newPosting: AppJobPosting) => {
    addJob(newPosting);
    toast({ title: "Job Saved", description: "Job posting saved and will appear in the lists."});
    setActiveTab('ranker');
  };

  const handleJobUpdate = (jobId: string, updates: Partial<AppJobPosting>) => {
      updateJob(jobId, updates);
      toast({ title: "Job Updated", description: "The job posting status has been updated." });
  }

  const handleJobDelete = (jobId: string) => {
    deleteJob(jobId);
    toast({ title: "Job Deleted", description: "The job posting has been permanently removed." });
  };
  
  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3">
          <TabsTrigger value="generator">Generator</TabsTrigger>
          <TabsTrigger value="ranker">Resume Ranker</TabsTrigger>
          <TabsTrigger value="previous">Previous Postings</TabsTrigger>
        </TabsList>
        <TabsContent value="generator" className="mt-4">
          <JobPostingGenerator onJobSaved={handleJobSaved} />
        </TabsContent>
        <TabsContent value="ranker" className="mt-4">
          <ResumeRanker 
            jobPostings={jobs}
            onJobDelete={handleJobDelete} 
            onJobUpdate={handleJobUpdate} 
          />
        </TabsContent>
        <TabsContent value="previous" className="mt-4">
          <PreviousPostings 
            jobPostings={jobs}
            onDelete={handleJobDelete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default withAuth(EmployerPage);