import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';import { ExternalLink, GitBranch, Link2, Mail, MapPin, Calendar, Code2, Brain, Database, Globe, Globe2, ChevronRight, ArrowUpRight, BookOpen, Award, Users, Star, Coffee, Heart } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumb';

const SKILLS = [
  { category: 'Languages', items: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'SQL', 'HTML/CSS'], icon: Code2, color: 'text-teal' },
  { category: 'AI/ML', items: ['TensorFlow', 'PyTorch', 'OpenCV', 'NLP', 'Computer Vision', 'Deep Learning', 'GANs'], icon: Brain, color: 'text-purple-500' },
  { category: 'Web Dev', items: ['React.js', 'Node.js', 'Express.js', 'Next.js', 'Tailwind CSS', 'MongoDB', 'REST APIs'], icon: Globe, color: 'text-blue-500' },
  { category: 'Tools', items: ['Git', 'Docker', 'Linux', 'VS Code', 'Figma', 'Postman', 'AWS'], icon: Database, color: 'text-orange-500' },
];

const PROJECTS = [
  {
    name: 'RECIPROCITY',
    description: 'Full-stack college management system with real-time attendance tracking, professor/student rankings, and 13,000+ Indian college directory.',
    tech: ['React', 'Node.js', 'MongoDB', 'Tailwind CSS'],
    link: '#',
    featured: true,
  },
  {
    name: 'AI-Powered Code Review',
    description: 'Machine learning system that automatically reviews pull requests and suggests improvements using NLP.',
    tech: ['Python', 'TensorFlow', 'GitHub API', 'FastAPI'],
    link: '#',
    featured: true,
  },
  {
    name: 'Real-Time Face Detection',
    description: 'Computer vision application for live face detection and recognition with 95%+ accuracy.',
    tech: ['Python', 'OpenCV', 'Deep Learning', 'Flask'],
    link: '#',
    featured: false,
  },
];

const TIMELINE = [
  { year: '2024', title: 'Building RECIPROCITY', desc: 'Full-stack college management platform with AI rankings' },
  { year: '2023', title: 'AI/ML Focus', desc: 'Deep dive into machine learning, computer vision, and NLP projects' },
  { year: '2022', title: 'Web Development', desc: 'Mastered React, Node.js, and modern web technologies' },
  { year: '2021', title: 'Started Coding', desc: 'Began programming journey with Python and C++' },
];

export default function Developer() {
  const [activeTab, setActiveTab] = useState('about');
  const [githubData, setGithubData] = useState(null);

  useEffect(() => {
    fetch('https://api.github.com/users/shubham001312')
      .then(r => r.json())
      .then(setGithubData)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      <Breadcrumb items={[
        { label: 'Home', path: '/' },
        { label: 'Developer' }
      ]} />
      
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-surface via-canvas to-surface-dim border-b border-line overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-10 left-10 w-72 h-72 bg-teal rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500 rounded-full blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto px-6 py-16 relative">
          <div className="flex flex-col md:flex-row items-start gap-8">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-teal to-purple-500 p-1">
                <div className="w-full h-full rounded-2xl bg-canvas flex items-center justify-center text-4xl font-bold text-teal">
                  SM
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-green-500 rounded-full border-4 border-canvas flex items-center justify-center">
                <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            
            {/* Info */}
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-text font-heading mb-1">Shubham Mallick</h1>
              <p className="text-lg text-teal font-medium mb-3">AI/ML Engineer & Full-Stack Developer</p>
              <p className="text-muted leading-relaxed max-w-2xl mb-4">
                Passionate about building intelligent systems and full-stack applications. 
                Currently exploring the intersection of AI/ML with web development to create 
                impactful solutions for real-world problems.
              </p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> India
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" /> Coding since 2021
                </span>
                <span className="flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" /> {githubData?.public_repos || '10+'} repositories
                </span>
              </div>
              
              {/* Social Links */}
              <div className="flex items-center gap-3 mt-5">
                <a href="https://github.com/shubham001312" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface hover:bg-teal-bg border border-line hover:border-teal/30 text-muted hover:text-teal transition-all">
                  <GitBranch className="w-5 h-5" />
                </a>
                <a href="https://linkedin.com/in/shubham-mallick" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface hover:bg-blue-500/10 border border-line hover:border-blue-500/30 text-muted hover:text-blue-500 transition-all">
                  <Link2 className="w-5 h-5" />
                </a>
                <a href="https://shubham001312.github.io/Shubham-Mallick/" target="_blank" rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-surface hover:bg-purple-500/10 border border-line hover:border-purple-500/30 text-muted hover:text-purple-500 transition-all">
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex gap-1 border-b border-line overflow-x-auto -mb-px">
          {['about', 'skills', 'projects', 'journey'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium capitalize whitespace-nowrap transition-colors border-b-2 ${
                activeTab === tab 
                  ? 'text-teal border-teal' 
                  : 'text-muted border-transparent hover:text-text hover:border-line'
              }`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {activeTab === 'about' && (
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-surface border border-line rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" /> What I Do
                </h3>
                <ul className="space-y-2 text-sm text-muted">
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                    Build full-stack web applications with React, Node.js, and MongoDB
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                    Develop AI/ML models for computer vision and NLP tasks
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                    Create intelligent systems that solve real-world problems
                  </li>
                  <li className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-teal mt-0.5 shrink-0" />
                    Contribute to open-source projects and share knowledge
                  </li>
                </ul>
              </div>
              
              <div className="bg-surface border border-line rounded-2xl p-6">
                <h3 className="font-semibold text-text mb-3 flex items-center gap-2">
                  <Award className="w-5 h-5 text-yellow-500" /> Highlights
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-canvas rounded-xl">
                    <div className="text-2xl font-bold text-teal">{githubData?.public_repos || '10+'}</div>
                    <div className="text-xs text-muted mt-1">Repositories</div>
                  </div>
                  <div className="text-center p-3 bg-canvas rounded-xl">
                    <div className="text-2xl font-bold text-teal">{githubData?.followers || '50+'}</div>
                    <div className="text-xs text-muted mt-1">Followers</div>
                  </div>
                  <div className="text-center p-3 bg-canvas rounded-xl">
                    <div className="text-2xl font-bold text-teal">13K+</div>
                    <div className="text-xs text-muted mt-1">College Records</div>
                  </div>
                  <div className="text-center p-3 bg-canvas rounded-xl">
                    <div className="text-2xl font-bold text-teal">3+</div>
                    <div className="text-xs text-muted mt-1">Major Projects</div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-surface border border-line rounded-2xl p-6">
              <h3 className="font-semibold text-text mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-500" /> About This Project
              </h3>
              <p className="text-sm text-muted leading-relaxed mb-4">
                <strong className="text-text">RECIPROCITY</strong> is a comprehensive college management 
                platform built to bridge the gap between students, professors, and institutions. 
                It features real-time attendance tracking, performance rankings, and a directory of 
                13,000+ Indian colleges sourced from official AICTE data.
              </p>
              <p className="text-sm text-muted leading-relaxed mb-4">
                The platform uses a dual-confirmation attendance system where both professor and 
                student must confirm attendance before it's locked — ensuring transparency and 
                preventing unauthorized modifications.
              </p>
              <p className="text-sm text-muted leading-relaxed">
                Built with the MERN stack (MongoDB, Express, React, Node.js) and designed with 
                a focus on clean UI/UX, responsive design, and accessibility.
              </p>
              
              <div className="mt-6 pt-4 border-t border-line">
                <h4 className="text-sm font-medium text-text mb-2">Tech Stack</h4>
                <div className="flex flex-wrap gap-2">
                  {['React', 'Node.js', 'Express', 'MongoDB', 'Tailwind CSS', 'JWT', 'REST API'].map(t => (
                    <span key={t} className="px-2.5 py-1 bg-teal-bg/50 text-teal text-xs rounded-lg font-medium">{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="grid md:grid-cols-2 gap-6">
            {SKILLS.map(({ category, items, icon: Icon, color }) => (
              <div key={category} className="bg-surface border border-line rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-xl bg-canvas ${color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-text">{category}</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {items.map(skill => (
                    <span key={skill} className="px-3 py-1.5 bg-canvas border border-line rounded-lg text-sm text-muted hover:text-text hover:border-teal/30 transition-colors cursor-default">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="space-y-6">
            {PROJECTS.map(p => (
              <div key={p.name} className={`bg-surface border rounded-2xl p-6 ${p.featured ? 'border-teal/30 ring-1 ring-teal/10' : 'border-line'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-text">{p.name}</h3>
                      {p.featured && <span className="px-2 py-0.5 bg-teal-bg text-teal text-xs rounded-full font-medium">Featured</span>}
                    </div>
                    <p className="text-sm text-muted mt-1">{p.description}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <div className="flex flex-wrap gap-2">
                    {p.tech.map(t => (
                      <span key={t} className="px-2 py-1 bg-canvas text-xs text-muted rounded-lg">{t}</span>
                    ))}
                  </div>
                  <a href={p.link} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-teal hover:text-teal/80 transition-colors">
                    View <ArrowUpRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'journey' && (
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-px bg-line"></div>
            <div className="space-y-8">
              {TIMELINE.map((item, i) => (
                <div key={i} className="relative pl-12">
                  <div className="absolute left-2.5 top-1 w-3 h-3 bg-teal rounded-full border-2 border-canvas"></div>
                  <div className="bg-surface border border-line rounded-xl p-5">
                    <span className="text-xs font-medium text-teal bg-teal-bg px-2 py-0.5 rounded-full">{item.year}</span>
                    <h3 className="font-semibold text-text mt-2">{item.title}</h3>
                    <p className="text-sm text-muted mt-1">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
