
"use client";

import { useState, useMemo, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Lightbulb, Search, Briefcase, User, Save, FileText, CheckCircle, XCircle, Circle, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';

import { analyzeResume, type AnalyzeResumeOutput } from '@/ai/ai-resume-insights';
import { suggestJobs, type SuggestJobsOutput } from '@/ai/flows/ai-job-suggestion';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { doc, setDoc, collection, query, where, addDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useJobs, type AppJobPosting } from '@/app/job-context';
import { formatDistanceToNow } from 'date-fns';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

type ResumeData = {
  personalInfo: {
    name: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  experience: { role: string; company: string; dates: string; description: string; }[];
  education: { degree: string; school: string; dates: string; }[];
  skills: string[];
  certificates: string[];
};

const initialResumeData: ResumeData = {
  personalInfo: {
    name: 'AVASH BANERJEE',
    email: 'itzavash@gmail.com',
    phone: '8336027886',
    location: 'Kolkata, India',
  },
  summary: 'Passionate Cyber-Security enthusiast with hands on experience in network security, security operations, and automation. Experienced in working with leading SIEM and SOAR platforms, and network security tools, backend and automation using python and modern web based frameworks. Assistant Teacher at a Computer Science institute as a part time',
  experience: [
    {
      role: 'Speaker and Core Member',
      company: 'IEM Cysec Club, IEM',
      dates: 'Jan 2023 - Present',
      description: 'Conducted and organized training sessions, and CTF events for College Cybersecurity Club',
    },
    {
      role: 'Intern',
      company: 'ITorizin Technologies pvt ltd, Kolkata',
      dates: 'Mar 2021 - Dec 2022',
      description: 'Worked as a SOC analyst, triaging security incidents, and responding to threats. Engineered a tool for SOC L1 level log parsing across different platforms and incident report automation which lowered the time and efforts of triaging, and prevented breach of SLAs. Engaged with various SIEM and SOAR platforms including Crowdstrike, Seceon, Securonix. Gained considerable Knowledge about the architecture, Threat Hunting and Threat Modelling',
    },
  ],
  education: [
    { degree: 'B-Tech (CSE)', school: 'Institute of Engineering & Management', dates: '2023-2027' },
    { degree: 'CLASS - XII (CBSE)', school: 'Bholananda National Vidyalaya', dates: '2023 passout' },
    { degree: 'CLASS - X (ICSE)', school: 'Modern English Academy', dates: '2021 passout' },
  ],
  skills: [
    'Python', 'Java', 'C',
    'Django', 'Flask', 'Fast-Api', 'HTML', 'CSS', 'JS', 'MySQL', 'Postgres', 'Supabase',
    'Firewall (Fortigate, pfsense)', 'SIEMs and SOARs (crowdstrike, seceon, securonix)', 'Incident triaging and reporting', 'SOC operations',
    'Burpsuite', 'Kali Linux', 'nmap', 'nessus', 'hydra', 'nikto', 'sqlmap', 'gobuster', 'sql injections', 'XSS', 'SSRF'
  ],
  certificates: [],
};

const resumeToText = (data: ResumeData) => {
  return `
    Name: ${data.personalInfo.name}
    Email: ${data.personalInfo.email}
    Phone: ${data.personalInfo.phone}
    Location: ${data.personalInfo.location}

    Summary:
    ${data.summary}

    Experience:
    ${data.experience.map(exp => `- ${exp.role} at ${exp.company} (${exp.dates})\n  ${exp.description}`).join('\n\n')}

    Education:
    ${data.education.map(edu => `- ${edu.degree}, ${edu.school} (${edu.dates})`).join('\n')}

    Skills: ${data.skills.join(', ')}
    Certificates: ${data.certificates.join(', ')}
  `.trim();
};

function ResumePreview({ data }: { data: ResumeData }) {
  return (
    <Card className="min-h-full border-2 border-primary/10 shadow-lg">
      <CardContent className="p-6">
        <div className="text-center border-b pb-4 mb-4">
          <h2 className="font-headline text-3xl font-bold">{data.personalInfo.name}</h2>
          <div className="text-sm text-muted-foreground flex justify-center items-center flex-wrap gap-x-4 gap-y-1 mt-1">
            <span>{data.personalInfo.location}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{data.personalInfo.email}</span>
            <span className="hidden sm:inline">&bull;</span>
            <span>{data.personalInfo.phone}</span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Summary</h3>
            <p className="text-sm">{data.summary}</p>
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Experience</h3>
            {data.experience.map((exp, i) => (
              <div key={i} className="mb-4 last:mb-0">
                <h4 className="font-bold">{exp.role}</h4>
                <p className="text-sm font-medium">{exp.company} | {exp.dates}</p>
                <p className="text-sm text-muted-foreground">{exp.description}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Education</h3>
            {data.education.map((edu, i) => (
              <div key={i} className="mb-2 last:mb-0">
                <h4 className="font-bold">{edu.degree}</h4>
                <p className="text-sm font-medium">{edu.school} | {edu.dates}</p>
              </div>
            ))}
          </div>

          <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Skills</h3>
            <div className="flex flex-wrap gap-2">
              {data.skills.map((skill, i) => <Badge key={i} variant="secondary">{skill}</Badge>)}
            </div>
          </div>
          
           <div>
            <h3 className="font-headline text-lg font-semibold border-b mb-2">Certificates</h3>
            <div className="flex flex-wrap gap-2">
              {data.certificates.map((cert, i) => <Badge key={i} variant="outline">{cert}</Badge>)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionAnalysis({ analysis }: { analysis: AnalyzeResumeOutput['sectionAnalyses'][0] }) {
  const [isOpen, setIsOpen] = useState(true);

  return (
     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="bg-muted/30">
        <CardHeader className="p-4">
            <CollapsibleTrigger className="flex justify-between items-center w-full">
                <CardTitle className="text-lg font-semibold">{analysis.section}</CardTitle>
                <div className="flex items-center gap-2">
                    <span className="font-bold text-base text-primary">{analysis.score}/100</span>
                    {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                </div>
            </CollapsibleTrigger>
            <Progress value={analysis.score} className="w-full h-2 mt-2" />
        </CardHeader>
        <CollapsibleContent>
            <CardContent className="px-4 pb-4 space-y-3">
                <div>
                    <h4 className="font-semibold text-sm">Reasoning:</h4>
                    <p className="text-sm text-muted-foreground">{analysis.reasoning}</p>
                </div>
                <div>
                    <h4 className="font-semibold text-sm">Suggestions:</h4>
                    <p className="text-sm text-muted-foreground">{analysis.suggestions}</p>
                </div>
            </CardContent>
        </CollapsibleContent>
      </Card>
     </Collapsible>
  )
}


function ResumeAnalysisDisplay({ analysis }: { analysis: AnalyzeResumeOutput | null }) {
  if (!analysis) return null;

  return (
    <div className="pt-4 space-y-6">
      <Separator />
      <h3 className="font-headline text-xl font-semibold">AI Resume Analysis</h3>
      
      <div className="space-y-2">
        <Label className="font-semibold text-base">Overall ATS Score</Label>
        <div className="flex items-center gap-4">
          <Progress value={analysis.overallScore} className="w-full h-3" />
          <span className="font-bold text-2xl text-primary">{analysis.overallScore}%</span>
        </div>
         <p className="text-sm text-muted-foreground">{analysis.overallSummary}</p>
      </div>

      {analysis.sectionAnalyses && analysis.sectionAnalyses.length > 0 && (
         <div className="space-y-4">
            <Label className="font-semibold text-base">Section Breakdown</Label>
            {analysis.sectionAnalyses.map((section, index) => (
                <SectionAnalysis key={index} analysis={section} />
            ))}
        </div>
      )}
    </div>
  );
}



function ResumeBuilder() {
  const [resumeData, setResumeData] = useState<ResumeData>(initialResumeData);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { firestore } = useFirebase();

  const handlePersonalInfoChange = (field: keyof ResumeData['personalInfo'], value: string) => {
    setResumeData(prev => ({ ...prev, personalInfo: { ...prev.personalInfo, [field]: value }}));
  };

  const handleAnalyzeResume = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const resumeText = resumeToText(resumeData);
      const result = await analyzeResume({ resumeText });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze resume. Please try again.");
    }
    setLoading(false);
  };
  
  const handleSaveResume = async () => {
    if (!firestore) {
        toast({
            variant: "default",
            title: "Demo Mode",
            description: "Saving is disabled in demo mode. Your resume will be used for applying within this session.",
        });
        return;
    }
    
    const userId = 'anonymous-user'; 

    setSaving(true);
    setError(null);
    try {
      const resumeText = resumeToText(resumeData);
      const resumeId = `resume-for-${userId}`; 
      const docRef = doc(firestore, "resumes", resumeId);
      const resumePayload = {
        id: resumeId,
        userProfileId: userId,
        title: `${resumeData.personalInfo.name}'s Resume`,
        content: JSON.stringify(resumeData),
        resumeText: resumeText,
      };

      await setDoc(docRef, resumePayload, { merge: true });

      toast({
        title: "Resume Saved",
        description: "Your resume has been saved successfully.",
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to save resume. Please try again.");
       toast({
        variant: "destructive",
        title: "Save Failed",
        description: e.message || "Could not save resume.",
      });
    }
    setSaving(false);
  };

  const handleExperienceChange = (index: number, field: keyof ResumeData['experience'][0], value: string) => {
    const newExperience = [...resumeData.experience];
    newExperience[index] = { ...newExperience[index], [field]: value };
    setResumeData(prev => ({ ...prev, experience: newExperience }));
  };

  const addExperience = () => {
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, { role: '', company: '', dates: '', description: '' }]
    }));
  };

  const removeExperience = (index: number) => {
    const newExperience = [...resumeData.experience];
    newExperience.splice(index, 1);
    setResumeData(prev => ({ ...prev, experience: newExperience }));
  };

  const handleEducationChange = (index: number, field: keyof ResumeData['education'][0], value: string) => {
    const newEducation = [...resumeData.education];
    newEducation[index] = { ...newEducation[index], [field]: value };
    setResumeData(prev => ({ ...prev, education: newEducation }));
  };

  const addEducation = () => {
    setResumeData(prev => ({
      ...prev,
      education: [...prev.education, { degree: '', school: '', dates: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    const newEducation = [...resumeData.education];
    newEducation.splice(index, 1);
    setResumeData(prev => ({ ...prev, education: newEducation }));
  };

  const handleSkillChange = (index: number, value: string) => {
    const newSkills = [...resumeData.skills];
    newSkills[index] = value;
    setResumeData(prev => ({ ...prev, skills: newSkills }));
  };

  const addSkill = () => {
    setResumeData(prev => ({ ...prev, skills: [...prev.skills, ''] }));
  };

  const removeSkill = (index: number) => {
    const newSkills = [...resumeData.skills];
    newSkills.splice(index, 1);
    setResumeData(prev => ({ ...prev, skills: newSkills }));
  };

  const handleCertificateChange = (index: number, value: string) => {
    const newCertificates = [...resumeData.certificates];
    newCertificates[index] = value;
    setResumeData(prev => ({ ...prev, certificates: newCertificates }));
  };

  const addCertificate = () => {
    setResumeData(prev => ({ ...prev, certificates: [...prev.certificates, ''] }));
  };

  const removeCertificate = (index: number) => {
    const newCertificates = [...resumeData.certificates];
    newCertificates.splice(index, 1);
    setResumeData(prev => ({ ...prev, certificates: newCertificates }));
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 items-start">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resume Builder</CardTitle>
          <CardDescription>Fill in your details to build your resume and get AI-powered feedback.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg flex items-center"><User className="mr-2 h-5 w-5"/> Personal Info</h3>
          <Input placeholder="Full Name" value={resumeData.personalInfo.name} onChange={e => handlePersonalInfoChange('name', e.target.value)} />
          <Input placeholder="Email" type="email" value={resumeData.personalInfo.email} onChange={e => handlePersonalInfoChange('email', e.target.value)} />
          <Input placeholder="Phone" type="tel" value={resumeData.personalInfo.phone} onChange={e => handlePersonalInfoChange('phone', e.target.value)} />
          <Input placeholder="Location" value={resumeData.personalInfo.location} onChange={e => handlePersonalInfoChange('location', e.target.value)} />

          <Separator/>
          
          <h3 className="font-semibold text-lg flex items-center"><Briefcase className="mr-2 h-5 w-5"/> Summary</h3>
          <Textarea placeholder="Professional Summary" className="min-h-[100px]" value={resumeData.summary} onChange={e => setResumeData(prev => ({...prev, summary: e.target.value}))} />
          
          <Separator/>

          <h3 className="font-semibold text-lg flex items-center">Experience</h3>
          {resumeData.experience.map((exp, index) => (
            <div key={index} className="space-y-2 border p-4 rounded-md">
              <Input placeholder="Role" value={exp.role} onChange={e => handleExperienceChange(index, 'role', e.target.value)} />
              <Input placeholder="Company" value={exp.company} onChange={e => handleExperienceChange(index, 'company', e.target.value)} />
              <Input placeholder="Dates" value={exp.dates} onChange={e => handleExperienceChange(index, 'dates', e.target.value)} />
              <Textarea placeholder="Description" value={exp.description} onChange={e => handleExperienceChange(index, 'description', e.target.value)} />
              <Button variant="destructive" size="sm" onClick={() => removeExperience(index)}>Remove</Button>
            </div>
          ))}
          <Button onClick={addExperience}>Add Experience</Button>

          <Separator/>

          <h3 className="font-semibold text-lg flex items-center">Education</h3>
          {resumeData.education.map((edu, index) => (
            <div key={index} className="space-y-2 border p-4 rounded-md">
              <Input placeholder="Degree" value={edu.degree} onChange={e => handleEducationChange(index, 'degree', e.target.value)} />
              <Input placeholder="School" value={edu.school} onChange={e => handleEducationChange(index, 'school', e.target.value)} />
              <Input placeholder="Dates" value={edu.dates} onChange={e => handleEducationChange(index, 'dates', e.target.value)} />
              <Button variant="destructive" size="sm" onClick={() => removeEducation(index)}>Remove</Button>
            </div>
          ))}
          <Button onClick={addEducation}>Add Education</Button>

          <Separator/>

          <h3 className="font-semibold text-lg flex items-center">Skills</h3>
          {resumeData.skills.map((skill, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input placeholder="Skill" value={skill} onChange={e => handleSkillChange(index, e.target.value)} />
              <Button variant="destructive" size="icon" onClick={() => removeSkill(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button onClick={addSkill}>Add Skill</Button>

          <Separator/>

          <h3 className="font-semibold text-lg flex items-center">Certificates</h3>
          {resumeData.certificates.map((cert, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input placeholder="Certificate" value={cert} onChange={e => handleCertificateChange(index, e.target.value)} />
              <Button variant="destructive" size="icon" onClick={() => removeCertificate(index)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          <Button onClick={addCertificate}>Add Certificate</Button>
          
          <Separator />

          <div className="pt-2 flex flex-wrap gap-2">
            <Button onClick={handleSaveResume} disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Resume
            </Button>
            <Button onClick={handleAnalyzeResume} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Resume
            </Button>
          </div>
            {loading && <p className="text-sm text-muted-foreground animate-pulse mt-2">AI is thinking...</p>}
            {error && <p className="text-sm text-destructive mt-2">{error}</p>}
            
            <ResumeAnalysisDisplay analysis={analysis} />

        </CardContent>
      </Card>
      <div className="lg:sticky top-24">
        <ResumePreview data={resumeData} />
      </div>
    </div>
  );
}


import * as pdfjs from 'pdfjs-dist';

function ResumeUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setLoading(true);
      setError(null);
      setAnalysis(null);
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          pdfjs.GlobalWorkerOptions.workerSrc = `/pdf.worker.min.mjs`;
          const doc = await pdfjs.getDocument(event.target.result as ArrayBuffer).promise;
          let text = '';
          for (let i = 1; i <= doc.numPages; i++) {
            const page = await doc.getPage(i);
            const content = await page.getTextContent();
            text += content.items.map((item: any) => item.str).join(' ');
          }
          setResumeText(text);
        } catch (error) {
          console.error("Failed to parse PDF:", error);
          setError(`Failed to parse PDF: ${error.message}`);
        }
        setLoading(false);
      };
      reader.readAsArrayBuffer(selectedFile);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!resumeText) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const result = await analyzeResume({ resumeText });
      setAnalysis(result);
    } catch (e) {
      console.error(e);
      setError("Failed to analyze resume. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Upload PDF CV</CardTitle>
        <CardDescription>Upload your resume in PDF format to get an AI-powered analysis.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="resume-upload">Upload your CV (PDF only)</Label>
          <Input id="resume-upload" type="file" accept=".pdf" onChange={handleFileChange} />
        </div>
        {resumeText && (
          <div className="space-y-4">
            <Textarea value={resumeText} readOnly className="min-h-[200px] bg-muted/50" />
            <Button onClick={handleAnalyzeResume} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Analyze Resume
            </Button>
          </div>
        )}
        {loading && <p className="text-sm text-muted-foreground animate-pulse">AI is thinking...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <ResumeAnalysisDisplay analysis={analysis} />
      </CardContent>
    </Card>
  );
}

function ResumeInsights() {
  const [jobDescription, setJobDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<AnalyzeResumeOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const resumeText = resumeToText(initialResumeData);
  
  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setAnalysis(null);
    try {
      const analysisResult = await analyzeResume({ resumeText, jobDescription });
      setAnalysis(analysisResult);
    } catch (e) {
      console.error(e);
      setError("Analysis failed. Please try again.");
    }
    setLoading(false);
  };
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">AI Resume Insights</CardTitle>
        <CardDescription>Paste a job description to get an ATS score and improvement suggestions for the sample resume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="job-desc-insights">Job Description</Label>
          <Textarea id="job-desc-insights" placeholder="Paste the job description here..." className="min-h-[150px]" value={jobDescription} onChange={e => setJobDescription(e.target.value)} />
        </div>
        <Button onClick={handleAnalyze} disabled={loading || !jobDescription}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          Analyze Against Job Description
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">AI is analyzing...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        <ResumeAnalysisDisplay analysis={analysis} />
      </CardContent>
    </Card>
  )
}

function JobSuggestions() {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestJobsOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSuggest = async () => {
    setLoading(true);
    setError(null);
    setSuggestions(null);
    try {
      const result = await suggestJobs({ 
        skills: initialResumeData.skills.join(', '), 
        experience: resumeToText(initialResumeData),
        certificates: initialResumeData.certificates.join(', ')
      });
      setSuggestions(result);
    } catch (e) {
      console.error(e);
      setError("Could not get suggestions. Please try again later.");
    }
    setLoading(false);
  }
  
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">AI Job Suggestions</CardTitle>
        <CardDescription>Let AI suggest relevant jobs based on the skills and experience in your resume.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={handleSuggest} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lightbulb className="mr-2 h-4 w-4" />}
          Find Jobs For Me
        </Button>
        {loading && <p className="text-sm text-muted-foreground animate-pulse">Searching for opportunities...</p>}
        {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        {suggestions && (
          <div className="pt-4 space-y-4">
            {suggestions.map((job, i) => (
              <Card key={i}>
                <CardHeader>
                  <CardTitle>{job.jobTitle}</CardTitle>
                  <CardDescription>{job.company}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground border-l-2 pl-2">"{job.reason}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function JobSearch({ onApply }: { onApply: (job: AppJobPosting) => void }) {
  const [queryText, setQueryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<AppJobPosting[] | null>(null);
  const { jobs } = useJobs();

  const handleSearch = () => {
    setIsLoading(true);
    // In a real app, this might be an API call. Here we filter the shared jobs list.
    setTimeout(() => {
      const lowercasedQuery = queryText.toLowerCase();
      const filteredJobs = jobs.filter(job => 
        job.status === 'active' && (
          job.jobTitle.toLowerCase().includes(lowercasedQuery) ||
          job.companyName.toLowerCase().includes(lowercasedQuery) ||
          job.jobPostingText.toLowerCase().includes(lowercasedQuery)
        )
      );
      setResults(filteredJobs);
      setIsLoading(false);
    }, 500);
  };
  
  const handleApply = (job: AppJobPosting) => {
    onApply(job);
  }

  return (
     <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Job Search</CardTitle>
        <CardDescription>Search for active job openings from our employer network.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Search by job title, e.g., 'Senior Frontend Developer'"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={isLoading || !queryText}>
            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
            Search
          </Button>
        </div>
        {isLoading && <p className="text-sm text-muted-foreground animate-pulse pt-4">Searching for jobs...</p>}
        
        {results && !isLoading && (
           <div className="pt-4 space-y-4">
            {results.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No jobs found for "{queryText}". Try another search.</p>
            ) : (
              results.map((job) => (
                <Card key={job.id} className="flex flex-col sm:flex-row justify-between sm:items-center p-4 gap-4">
                  <div className="flex-1">
                    <h4 className="font-semibold">{job.jobTitle}</h4>
                    <p className="text-sm text-muted-foreground">{job.companyName} - {job.location}</p>
                    <p className="text-sm text-muted-foreground mt-1">Posted {formatDistanceToNow(new Date(job.createdAt))} ago</p>
                    <p className="text-sm mt-2 line-clamp-2">{job.jobPostingText}</p>
                  </div>
                  <Button onClick={() => handleApply(job)}>Apply</Button>
                </Card>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

const applicationStatuses = [
  'Submitted',
  'Reviewed',
  'Interview',
  'Offer',
  'Accepted',
] as const;

type ApplicationStatus = (typeof applicationStatuses)[number] | 'Rejected' | 'Internship';

type Application = {
  id: string;
  jobTitle: string;
  companyName: string;
  status: ApplicationStatus;
  statusText: string;
};

const initialApplications: Application[] = [
  { id: 'app1', jobTitle: 'Frontend Developer', companyName: 'Vercel', status: 'Interview', statusText: 'Scheduled for next week' },
  { id: 'app2', jobTitle: 'UX Designer', companyName: 'Figma', status: 'Accepted', statusText: 'Offer accepted! Start date confirmed.' },
  { id: 'app3', jobTitle: 'Backend Engineer', companyName: 'Supabase', status: 'Rejected', statusText: 'Rejected after initial screening.' },
  { id: 'app4', jobTitle: 'Data Analyst Intern', companyName: 'Notion', status: 'Internship', statusText: 'Internship in progress.' },
];

function ApplicationProgressBar({ status }: { status: ApplicationStatus }) {
  const currentIndex = applicationStatuses.indexOf(status as any);

  const isFinalPositiveState = status === 'Accepted' || status === 'Internship';
  const isRejected = status === 'Rejected';

  if (isRejected) {
    return (
      <div className="flex items-center gap-2 text-destructive">
        <XCircle className="h-5 w-5" />
        <span className="font-medium">Rejected</span>
      </div>
    );
  }
  
  if (isFinalPositiveState) {
     const Icon = status === 'Accepted' ? CheckCircle : Briefcase;
     const text = status === 'Accepted' ? 'Accepted' : 'Internship Ongoing';
     return (
        <div className="flex items-center gap-2 text-green-600">
          <Icon className="h-5 w-5" />
          <span className="font-medium">{text}</span>
        </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-3">
        {applicationStatuses.map((step, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;
          
          return (
             <Tooltip key={step}>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                  <div
                    className={cn(
                      'h-6 w-6 rounded-full flex items-center justify-center border-2',
                      isCompleted ? 'bg-primary border-primary text-primary-foreground' : 'bg-muted border-border',
                      isActive ? 'border-primary' : ''
                    )}
                  >
                    {isCompleted ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-muted" />}
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{step}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 -z-10" />
        <div 
          className="absolute top-1/2 left-0 h-0.5 bg-primary -translate-y-1/2 -z-10 transition-all" 
          style={{ width: `calc(${currentIndex / (applicationStatuses.length - 1) * 100}% - 1.5rem)`}}
        />
      </div>
    </TooltipProvider>
  );
}


function ApplicationTracker({ applications, onWithdraw }: { applications: Application[], onWithdraw: (applicationId: string) => void }) {
  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline">Application Tracker</CardTitle>
        <CardDescription>Keep track of all your job applications and their current status.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {applications.length > 0 ? (
          applications.map((app) => (
            <Card key={app.id} className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-semibold">{app.jobTitle}</h4>
                  <p className="text-sm text-muted-foreground">{app.companyName}</p>
                </div>
                 <div className="w-full sm:w-auto">
                  <div className="relative w-full max-w-md">
                     <ApplicationProgressBar status={app.status} />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <p className="text-sm text-muted-foreground ">{app.statusText}</p>
                <Button variant="destructive" size="sm" onClick={() => onWithdraw(app.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Withdraw
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <div className="text-center text-muted-foreground py-12">
            <FileText className="mx-auto h-12 w-12" />
            <p className="mt-4">You haven't applied for any jobs yet.</p>
            <p className="text-sm">Start by searching for jobs in the "Job Search" tab.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


export default function JobSeekerPage() {
  const [applications, setApplications] = useState<Application[]>(initialApplications);
  const [activeTab, setActiveTab] = useState("builder");
  const { toast } = useToast();

  const handleApply = useCallback((job: AppJobPosting) => {
    // Check if an application for this job already exists
    if (applications.some(app => app.id === `app-${job.id}`)) {
      toast({
        variant: "default",
        title: "Already Applied",
        description: `You have already applied for the ${job.jobTitle} position.`,
      });
      return;
    }

    const newApplication: Application = {
      id: `app-${job.id}`,
      jobTitle: job.jobTitle,
      companyName: job.companyName,
      status: 'Submitted',
      statusText: `Application sent ${formatDistanceToNow(new Date())} ago.`,
    };

    setApplications(prev => [newApplication, ...prev]);
    toast({
      title: "Application Sent!",
      description: `Your application for ${job.jobTitle} has been submitted.`,
    });
    setActiveTab("tracker");
  }, [applications, toast]);

  const handleWithdraw = useCallback((applicationId: string) => {
    const withdrawnApp = applications.find(app => app.id === applicationId);
    setApplications(prev => prev.filter(app => app.id !== applicationId));
    toast({
      title: "Application Withdrawn",
      description: `You have withdrawn your application for ${withdrawnApp?.jobTitle}.`,
    });
  }, [applications, toast]);


  return (
    <div className="container mx-auto max-w-7xl py-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:grid-cols-6">
          <TabsTrigger value="builder">Resume Builder</TabsTrigger>
          <TabsTrigger value="upload">Upload CV</TabsTrigger>
          <TabsTrigger value="insights">AI Resume Insights</TabsTrigger>
          <TabsTrigger value="suggestions">AI Job Suggestions</TabsTrigger>
          <TabsTrigger value="search">Job Search</TabsTrigger>
          <TabsTrigger value="tracker">Application Tracker</TabsTrigger>
        </TabsList>
        <TabsContent value="builder" className="mt-4">
          <ResumeBuilder />
        </TabsContent>
        <TabsContent value="upload" className="mt-4">
          <ResumeUpload />
        </TabsContent>
        <TabsContent value="insights" className="mt-4">
          <ResumeInsights />
        </TabsContent>
        <TabsContent value="suggestions" className="mt-4">
          <JobSuggestions />
        </TabsContent>
        <TabsContent value="search" className="mt-4">
          <JobSearch onApply={handleApply} />
        </TabsContent>
        <TabsContent value="tracker" className="mt-4">
          <ApplicationTracker applications={applications} onWithdraw={handleWithdraw} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
