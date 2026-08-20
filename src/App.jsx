import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsPDF from 'jspdf';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, Download, Check,
  User, Briefcase, FolderKanban, GraduationCap, Sparkles,
  Loader2, CloudCheck, Mail, Phone, Link, GitBranch, MapPin
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL;
async function adminLogin(username, password) {
    const response = await fetch(`${API_URL}/Admin/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            username,
            password,
        }),
    });

    if (!response.ok) {
        throw new Error('Invalid admin username or password.');
    }

    return await response.json();
}
const getVisitorId = () => {
    let visitorId = localStorage.getItem('cvbuilder_visitor_id');

    if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem('cvbuilder_visitor_id', visitorId);
    }

    return visitorId;
};

async function createCv(cvData) {
    const response = await fetch(`${API_URL}/Cv`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cvData),
    });

    const responseText = await response.text();

    if (!response.ok) {
        throw new Error(
            `Failed to create CV: ${response.status} ${responseText}`
        );
    }

    return JSON.parse(responseText);
}

async function updateCv(cvId, cvData) {
    const response = await fetch(`${API_URL}/Cv/${cvId}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(cvData),
    });

    const responseText = await response.text();

    console.log("Update CV status:", response.status);
    console.log("Update CV response:", responseText);

    if (!response.ok) {
        throw new Error(
            `Failed to update CV: ${response.status} ${responseText}`
        );
    }

    return JSON.parse(responseText);
}
function mapDataToCv(data) {
    return {
        fullName: data.name,
        professionalTitle: data.title,
        shortBio: data.bio,
        email: data.email,
        phone: data.phone,
        location: data.location,
        linkedInUrl: data.Link,
        gitHubUrl: data.GitBranch,
    };
}
const FONT_IMPORT_ID = 'cv-builder-fonts';
function ensureFonts() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(FONT_IMPORT_ID)) return;
  const link = document.createElement('link');
  link.id = FONT_IMPORT_ID;
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap';
  document.head.appendChild(link);
}

const COLORS = {
  bg: '#0A0E1A',
  surface: '#131A30',
  surface2: '#0D1226',
  border: '#232C4A',
  text: '#F1F3FA',
  muted: '#9099BD',
  mutedDark: '#525C82',
  violet: '#8B7CFF',
  teal: '#4FE3D0',
  danger: '#FF6B6B',
};

const THEMES = {
    classic: {
        key: 'classic',
        name: 'Classic Professional',
        desc: 'Clean, traditional and suitable for most careers',
        swatch: ['#ffffff', '#174a7c', '#202124'],
    },

    dark: {
        key: 'dark',
        name: 'Dark Technical',
        desc: 'For developers, engineers and technical roles',
        swatch: ['#0A0E1A', '#8B7CFF', '#4FD8CC'],
    },

    clean: {
        key: 'clean',
        name: 'Clean Minimal',
        desc: 'Simple, modern and highly readable',
        swatch: ['#ffffff', '#111827', '#6b7280'],
    },

    bold: {
        key: 'bold',
        name: 'Bold Creative',
        desc: 'For design, marketing and creative roles',
        swatch: ['#17121C', '#ff4f8b', '#ffb43b'],
    },

    corporate: {
        key: 'corporate',
        name: 'Classic Corporate',
        desc: 'Conservative and formal for corporate roles',
        swatch: ['#ffffff', '#123f68', '#374151'],
    },

    executive: {
        key: 'executive',
        name: 'Executive Navy',
        desc: 'Premium layout for managers and senior professionals',
        swatch: ['#ffffff', '#0f3d63', '#1f2937'],
    },

    elegant: {
        key: 'elegant',
        name: 'Elegant Serif',
        desc: 'Refined typography for traditional professions',
        swatch: ['#ffffff', '#5b4636', '#292524'],
    },

    slate: {
        key: 'slate',
        name: 'Modern Slate',
        desc: 'Contemporary corporate style',
        swatch: ['#f8fafc', '#334155', '#64748b'],
    },

    ats: {
        key: 'ats',
        name: 'ATS Compact',
        desc: 'Simple, compact and optimized for applicant tracking systems',
        swatch: ['#ffffff', '#111827', '#374151'],
    },

    teal: {
        key: 'teal',
        name: 'Professional Teal',
        desc: 'Modern style for business, finance and technology',
        swatch: ['#ffffff', '#0f766e', '#334155'],
    },
};

const STEPS = [
  { key: 'basics', label: 'Basics', icon: User },
  { key: 'skills', label: 'Skills', icon: Sparkles },
  { key: 'experience', label: 'Experience', icon: Briefcase },
  { key: 'projects', label: 'Projects', icon: FolderKanban },
  { key: 'education', label: 'Education', icon: GraduationCap },
  { key: 'export', label: 'Export', icon: Download },
];

const EMPTY_DATA = {
  name: '', title: '', bio: '',
  email: '', phone: '', Link: '', GitBranch: '', location: '',
  skills: [],
  experience: [],
  projects: [],
  education: [],
};

let idCounter = 1;
const nextId = () => `id_${idCounter++}_${Date.now()}`;

function slugify(name) {
  return (name || 'yourname').toLowerCase().trim().replace(/[^a-z0-9]+/g, '') || 'yourname';
}

// ---------- Small building blocks ----------

function Field({ label, children, hint }) {
  return (
      <div style={{ marginBottom: 18 }}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: COLORS.muted, marginBottom: 6, letterSpacing: 0.2 }}>
          {label}
        </label>
        {children}
        {hint && <div style={{ fontSize: 12, color: COLORS.mutedDark, marginTop: 5 }}>{hint}</div>}
      </div>
  );
}

const inputStyle = {
  width: '100%',
  background: COLORS.surface2,
  border: `1px solid ${COLORS.border}`,
  borderRadius: 10,
  padding: '11px 14px',
  color: COLORS.text,
  fontSize: 14.5,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

function TextInput(props) {
  return <input {...props} style={{ ...inputStyle, ...(props.style || {}) }} />;
}
function TextArea(props) {
  return <textarea {...props} style={{ ...inputStyle, resize: 'vertical', minHeight: 80, lineHeight: 1.5, ...(props.style || {}) }} />;
}

function IconButton({ onClick, children, danger, style }) {
  return (
      <button
          onClick={onClick}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'transparent',
            border: `1px solid ${danger ? '#5A2A2A' : COLORS.border}`,
            color: danger ? COLORS.danger : COLORS.muted,
            borderRadius: 8, padding: '7px 12px', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            ...style,
          }}
      >
        {children}
      </button>
  );
}

function PrimaryButton({ onClick, children, disabled, style }) {
  return (
      <button
          onClick={onClick}
          disabled={disabled}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: disabled ? COLORS.border : `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.teal})`,
            border: 'none', color: disabled ? COLORS.mutedDark : '#0A0E1A',
            borderRadius: 10, padding: '12px 22px', fontSize: 14.5, fontWeight: 700,
            cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif',
            ...style,
          }}
      >
        {children}
      </button>
  );
}

function GhostButton({ onClick, children, style }) {
  return (
      <button
          onClick={onClick}
          style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'transparent', border: `1px solid ${COLORS.border}`, color: COLORS.text,
            borderRadius: 10, padding: '12px 20px', fontSize: 14.5, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
            ...style,
          }}
      >
        {children}
      </button>
  );
}

function Chip({ text, onRemove }) {
    return (
        <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: `${COLORS.violet}1A`,
            border: `1px solid ${COLORS.violet}55`,
            color: COLORS.text,
            borderRadius: 999,
            padding: '6px 8px 6px 14px',
            fontSize: 13.5,
            margin: '0 8px 8px 0',
            fontFamily: 'Inter, sans-serif',
        }}>
      {typeof text === 'object' ? text.name : text}

            <button
                onClick={onRemove}
                style={{
                    background: 'none',
                    border: 'none',
                    color: COLORS.muted,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: 2,
                }}
            >
        <Trash2 size={13} />
      </button>
    </span>
    );
}

// ---------- Step editors ----------

function BasicsStep({ data, update }) {
  return (
      <div>
        <Field label="Full name">
          <TextInput value={data.name} onChange={e => update({ name: e.target.value })} placeholder="Josiah Onyeje" />
        </Field>
        <Field label="Professional title">
          <TextInput value={data.title} onChange={e => update({ title: e.target.value })} placeholder="Senior Software Engineer" />
        </Field>
        <Field label="Short bio" hint="2-3 sentences. This becomes your hero summary.">
          <TextArea value={data.bio} onChange={e => update({ bio: e.target.value })} placeholder="Senior backend engineer building secure, scalable systems for banking and fintech..." />
        </Field>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <Field label="Email">
            <TextInput value={data.email} onChange={e => update({ email: e.target.value })} placeholder="you@email.com" />
          </Field>
          <Field label="Phone">
            <TextInput value={data.phone} onChange={e => update({ phone: e.target.value })} placeholder="+234..." />
          </Field>
          <Field label="LinkedIn">
            <TextInput value={data.Link} onChange={e => update({ Link: e.target.value })} placeholder="linkedin.com/in/you" />
          </Field>
          <Field label="GitHub / Portfolio link">
            <TextInput value={data.GitBranch} onChange={e => update({ GitBranch: e.target.value })} placeholder="github.com/you" />
          </Field>
        </div>
        <Field label="Location">
          <TextInput value={data.location} onChange={e => update({ location: e.target.value })} placeholder="Lagos, Nigeria" />
        </Field>
      </div>
  );
}

function SkillsStep({ data, update, cvId }) {
    const [draft, setDraft] = useState('');
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState(null);

    const add = async () => {
        const v = draft.trim();

        if (!v || !cvId || saving) return;

        try {
            setSaving(true);

            const response = await fetch(`${API_URL}/Cv/${cvId}/skills`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: v,
                }),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to add skill: ${response.status} ${responseText}`
                );
            }

            const skill = JSON.parse(responseText);

            update({
                skills: [
                    ...data.skills,
                    {
                        id: skill.id,
                        name: skill.name,
                    },
                ],
            });

            setDraft('');
        } catch (error) {
            console.error('ADD SKILL ERROR:', error);
            alert(`Failed to add skill: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const removeSkill = async (skill, index) => {
        if (!cvId || !skill.id || deletingId) return;

        try {
            setDeletingId(skill.id);

            const response = await fetch(
                `${API_URL}/Cv/${cvId}/skills/${skill.id}`,
                {
                    method: 'DELETE',
                }
            );

            if (!response.ok) {
                const responseText = await response.text();

                throw new Error(
                    `Failed to delete skill: ${response.status} ${responseText}`
                );
            }

            update({
                skills: data.skills.filter((_, idx) => idx !== index),
            });
        } catch (error) {
            console.error('DELETE SKILL ERROR:', error);
            alert(`Failed to delete skill: ${error.message}`);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div>
            <Field
                label="Add a skill"
                hint="Press Enter or click Add. Add skills that highlight your strengths and expertise."
            >
                <div style={{ display: 'flex', gap: 10 }}>
                    <TextInput
                        value={draft}
                        onChange={e => setDraft(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                add();
                            }
                        }}
                        placeholder="e.g. Communication, Leadership, Microsoft Excel"
                    />

                    <GhostButton
                        onClick={add}
                        disabled={saving}
                        style={{
                            padding: '11px 18px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <Plus size={16} />
                        {saving ? 'Adding...' : 'Add'}
                    </GhostButton>
                </div>
            </Field>

            <div
                style={{
                    marginTop: 6,
                    display: 'flex',
                    flexWrap: 'wrap',
                }}
            >
                {data.skills.length === 0 && (
                    <div
                        style={{
                            color: COLORS.mutedDark,
                            fontSize: 13.5,
                        }}
                    >
                        No skills added yet.
                    </div>
                )}

                {data.skills.map((skill, i) => (
                    <Chip
                        key={skill.id || i}
                        text={skill.name}
                        onRemove={() => removeSkill(skill, i)}
                    />
                ))}
            </div>
        </div>
    );
}

function RepeatingSection({ items, onAdd, onRemove, onChange, renderItem, addLabel, emptyLabel }) {
  return (
      <div>
        {items.length === 0 && (
            <div style={{ color: COLORS.mutedDark, fontSize: 13.5, marginBottom: 16 }}>{emptyLabel}</div>
        )}
        {items.map((item, idx) => (
            <div key={item.id} style={{
              background: COLORS.surface2, border: `1px solid ${COLORS.border}`, borderRadius: 12,
              padding: 18, marginBottom: 14, position: 'relative',
            }}>
              <button
                  onClick={() => onRemove(item.id)}
                  style={{
                    position: 'absolute', top: 14, right: 14, background: 'none', border: 'none',
                    color: COLORS.mutedDark, cursor: 'pointer', display: 'flex', padding: 4,
                  }}
                  aria-label="Remove"
              >
                <Trash2 size={16} />
              </button>
              {renderItem(item, (patch) => onChange(item.id, patch))}
            </div>
        ))}
        <GhostButton onClick={onAdd}><Plus size={16} /> {addLabel}</GhostButton>
      </div>
  );
}

function ExperienceStep({ data, update, cvId }) {
    const addExp = () => update({
        experience: [
            ...data.experience,
            {
                id: nextId(),
                company: '',
                role: '',
                location: '',
                start: '',
                end: '',
                isCurrent: false,
                bullets: ['']
            }
        ]
    });
    const [deletingId, setDeletingId] = useState(null);

    const removeExp = async (id) => {
        if (!id) return;

        const isGuid =
            /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        // Unsaved frontend-only experience
        if (!isGuid) {
            update({
                experience: data.experience.filter(e => e.id !== id),
            });
            return;
        }

        if (!cvId) return;

        try {
            setDeletingId(id);

            const response = await fetch(
                `${API_URL}/Cv/${cvId}/experiences/${id}`,
                {
                    method: 'DELETE',
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to delete experience: ${response.status} ${responseText}`
                );
            }

            update({
                experience: data.experience.filter(e => e.id !== id),
            });

        } catch (error) {
            console.error('DELETE EXPERIENCE ERROR:', error);
            alert(`Failed to delete experience: ${error.message}`);
        } finally {
            setDeletingId(null);
        }
    };
    const [savingId, setSavingId] = useState(null);

    const saveExperience = async (exp) => {
        if (!cvId) {
            alert('CV has not been created yet.');
            return;
        }

        if (!exp.company.trim() || !exp.role.trim() || !exp.start) {
            alert('Please enter the company, role, and start date.');
            return;
        }

        try {
            setSavingId(exp.id);

            const response = await fetch(`${API_URL}/Cv/${cvId}/experiences`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    jobTitle: exp.role,
                    company: exp.company,
                    location: exp.location,
                    startDate: exp.start,
                    endDate: exp.isCurrent || !exp.end ? null : exp.end,
                    isCurrent: exp.isCurrent,
                    description: exp.bullets
                        .filter(b => b.trim())
                        .join('\n'),
                }),
            });

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to save experience: ${response.status} ${responseText}`
                );
            }

            const savedExperience = JSON.parse(responseText);

            console.log('Experience saved:', savedExperience);

            update({
                experience: data.experience.map(item =>
                    item.id === exp.id
                        ? {
                            ...item,
                            id: savedExperience.id,
                            saved: true,
                        }
                        : item
                ),
            });

            alert('Experience saved successfully.');

        } catch (error) {
            console.error('SAVE EXPERIENCE ERROR:', error);
            alert(`Failed to save experience: ${error.message}`);
        } finally {
            setSavingId(null);
        }
    };
  const changeExp = (id, patch) => update({
    experience: data.experience.map(e => e.id === id ? { ...e, ...patch } : e)
  });
  const updateBullet = (exp, i, val) => {
    const bullets = [...exp.bullets];
    bullets[i] = val;
    changeExp(exp.id, { bullets });
  };
  const addBullet = (exp) => changeExp(exp.id, { bullets: [...exp.bullets, ''] });
  const removeBullet = (exp, i) => changeExp(exp.id, { bullets: exp.bullets.filter((_, idx) => idx !== i) });

  return (
      <RepeatingSection
          items={data.experience}
          onAdd={addExp}
          onRemove={removeExp}
          onChange={changeExp}
          addLabel="Add work experience"
          emptyLabel="No experience added yet."
          renderItem={(exp) => (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Field label="Company">
                    <TextInput value={exp.company} onChange={e => changeExp(exp.id, { company: e.target.value })} placeholder="Company name" />
                  </Field>
                  <Field label="Role">
                    <TextInput value={exp.role} onChange={e => changeExp(exp.id, { role: e.target.value })} placeholder="Job title" />
                  </Field>
                </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                      <Field label="Location">
                          <TextInput
                              value={exp.location || ''}
                              onChange={e =>
                                  changeExp(exp.id, { location: e.target.value })
                              }
                              placeholder="Lagos, Nigeria"
                          />
                      </Field>

                      <Field label="Employment status">
                          <label style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              fontSize: 14,
                              color: COLORS.text,
                              cursor: 'pointer',
                          }}>
                              <input
                                  type="checkbox"
                                  checked={exp.isCurrent || false}
                                  onChange={e =>
                                      changeExp(exp.id, {
                                          isCurrent: e.target.checked,
                                          end: e.target.checked ? '' : exp.end,
                                      })
                                  }
                              />
                              I currently work here
                          </label>
                      </Field>
                  </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Field label="Start date">
                        <TextInput
                            type="date"
                            value={exp.start}
                            onChange={e =>
                                changeExp(exp.id, { start: e.target.value })
                            }
                        />
                    </Field>
                    <Field label="End date">
                        <TextInput
                            type="date"
                            value={exp.end}
                            disabled={exp.isCurrent}
                            onChange={e =>
                                changeExp(exp.id, { end: e.target.value })
                            }
                        />
                    </Field>
                </div>
                <Field label="What you did">
                  {exp.bullets.map((b, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                        <TextInput value={b} onChange={e => updateBullet(exp, i, e.target.value)} placeholder="Built and shipped..." />
                        {exp.bullets.length > 1 && (
                            <button onClick={() => removeBullet(exp, i)} style={{ background: 'none', border: 'none', color: COLORS.mutedDark, cursor: 'pointer' }}>
                              <Trash2 size={15} />
                            </button>
                        )}
                      </div>
                  ))}
                  <button onClick={() => addBullet(exp)} style={{
                    background: 'none', border: 'none', color: COLORS.teal, cursor: 'pointer',
                    fontSize: 13, fontFamily: 'Inter, sans-serif', padding: 0, display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    <Plus size={14} /> Add bullet point
                  </button>
                </Field>
                  <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 8,
                  }}>
                      <GhostButton
                          onClick={() => saveExperience(exp)}
                          disabled={savingId === exp.id}
                          style={{
                              padding: '10px 18px',
                              whiteSpace: 'nowrap',
                          }}
                      >
                          {savingId === exp.id ? 'Saving...' : 'Save Experience'}
                      </GhostButton>
                  </div>
              </>
          )}
      />
  );
}

function ProjectsStep({ data, update, cvId }) {
    const [savingId, setSavingId] = useState(null);
    const addProj = () => update({
        projects: [
            ...data.projects,
            {
                id: nextId(),
                title: '',
                role: '',
                description: '',
                tags: '',
                link: ''
            }
        ]
    });
    const saveProject = async (project) => {
        if (!cvId) {
            alert('CV has not been created yet.');
            return;
        }

        if (!project.title.trim()) {
            alert('Please enter a project title.');
            return;
        }

        try {
            setSavingId(project.id);

            const response = await fetch(
                `${API_URL}/Cv/${cvId}/projects`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        title: project.title,
                        role: project.role,
                        description: project.description,
                        technologies: project.tags,
                        projectUrl: project.link,
                    }),
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to save project: ${response.status} ${responseText}`
                );
            }

            const savedProject = JSON.parse(responseText);

            console.log('Project saved:', savedProject);

            update({
                projects: data.projects.map(item =>
                    item.id === project.id
                        ? {
                            ...item,
                            id: savedProject.id,
                            saved: true,
                        }
                        : item
                ),
            });

            alert('Project saved successfully.');

        } catch (error) {
            console.error('SAVE PROJECT ERROR:', error);
            alert(`Failed to save project: ${error.message}`);
        } finally {
            setSavingId(null);
        }
    };
    const [deletingId, setDeletingId] = useState(null);

    const removeProj = async (id) => {
        if (!cvId || !id) return;

        try {
            setDeletingId(id);

            const response = await fetch(
                `${API_URL}/Cv/${cvId}/projects/${id}`,
                {
                    method: 'DELETE',
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to delete project: ${response.status} ${responseText}`
                );
            }

            update({
                projects: data.projects.filter(
                    p => p.id !== id
                ),
            });

        } catch (error) {
            console.error('DELETE PROJECT ERROR:', error);
            alert(`Failed to delete project: ${error.message}`);
        } finally {
            setDeletingId(null);
        }
    };
  const changeProj = (id, patch) => update({
    projects: data.projects.map(p => p.id === id ? { ...p, ...patch } : p)
  });
  return (
      <RepeatingSection
          items={data.projects}
          onAdd={addProj}
          onRemove={removeProj}
          onChange={changeProj}
          addLabel="Add project"
          emptyLabel="No projects added yet."
          renderItem={(p) => (
              <>
                <Field label="Project title">
                  <TextInput value={p.title} onChange={e => changeProj(p.id, { title: e.target.value })} placeholder="Project name" />
                </Field>
                  <Field label="Your role">
                      <TextInput
                          value={p.role || ''}
                          onChange={e =>
                              changeProj(p.id, { role: e.target.value })
                          }
                          placeholder="e.g. Backend Developer, Project Manager, Designer"
                      />
                  </Field>
                <Field label="Description">
                  <TextArea value={p.description} onChange={e => changeProj(p.id, { description: e.target.value })} placeholder="What it does and what you built..." />
                </Field>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 12
                }}>
                    <Field label="Technologies / Tools / Skills" hint="Comma separated">
                        <TextInput
                            value={p.tags}
                            onChange={e =>
                                changeProj(p.id, { tags: e.target.value })
                            }
                            placeholder="Microsoft Excel, Canva, Python, Leadership"
                        />
                    </Field>

                    <Field label="Link (optional)">
                        <TextInput
                            value={p.link}
                            onChange={e =>
                                changeProj(p.id, { link: e.target.value })
                            }
                            placeholder="https://..."
                        />
                    </Field>
                </div>

                <div style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    marginTop: 8,
                }}>
                    <GhostButton
                        onClick={() => saveProject(p)}
                        disabled={savingId === p.id}
                        style={{
                            padding: '10px 18px',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {savingId === p.id ? 'Saving...' : 'Save Project'}
                    </GhostButton>
                </div>
              </>
          )}
      />
  );
}

function EducationStep({ data, update, cvId }) {
    const [savingId, setSavingId] = useState(null);
    const addEdu = () => update({
        education: [
            ...data.education,
            {
                id: nextId(),
                school: '',
                degree: '',
                fieldOfStudy: '',
                location: '',
                startDate: '',
                endDate: '',
                isCurrent: false,
            }
        ]
    });
  const removeEdu = (id) => update({ education: data.education.filter(e => e.id !== id) });
  const changeEdu = (id, patch) => update({
    education: data.education.map(e => e.id === id ? { ...e, ...patch } : e)
  });
    const saveEducation = async (edu) => {
        if (!cvId) {
            alert('CV has not been created yet.');
            return;
        }

        if (!edu.school.trim()) {
            alert('Please enter the institution.');
            return;
        }

        try {
            setSavingId(edu.id);

            const response = await fetch(
                `${API_URL}/Cv/${cvId}/educations`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        institution: edu.school,
                        degree: edu.degree,
                        fieldOfStudy: edu.fieldOfStudy,
                        location: edu.location,
                        startDate: edu.startDate,
                        endDate: edu.isCurrent ? null : (edu.endDate || null),
                        isCurrent: edu.isCurrent,
                    }),
                }
            );

            const responseText = await response.text();

            if (!response.ok) {
                throw new Error(
                    `Failed to save education: ${response.status} ${responseText}`
                );
            }

            const savedEducation = JSON.parse(responseText);

            console.log('Education saved:', savedEducation);

            update({
                education: data.education.map(item =>
                    item.id === edu.id
                        ? {
                            ...item,
                            backendId: savedEducation.id,
                            saved: true,
                        }
                        : item
                ),
            });

            alert('Education saved successfully.');

        } catch (error) {
            console.error('SAVE EDUCATION ERROR:', error);
            alert(`Failed to save education: ${error.message}`);
        } finally {
            setSavingId(null);
        }
    };
  return (
      <RepeatingSection
          items={data.education}
          onAdd={addEdu}
          onRemove={removeEdu}
          onChange={changeEdu}
          addLabel="Add education"
          emptyLabel="No education added yet."
          renderItem={(edu) => (
              <>
                  <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12
                  }}>
                      <Field label="Institution">
                          <TextInput
                              value={edu.school}
                              onChange={e =>
                                  changeEdu(edu.id, { school: e.target.value })
                              }
                              placeholder="University, College, School..."
                          />
                      </Field>

                      <Field label="Degree / Qualification">
                          <TextInput
                              value={edu.degree}
                              onChange={e =>
                                  changeEdu(edu.id, { degree: e.target.value })
                              }
                              placeholder="B.Sc, HND, MBA, Diploma..."
                          />
                      </Field>
                  </div>

                  <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12
                  }}>
                      <Field label="Field of study">
                          <TextInput
                              value={edu.fieldOfStudy}
                              onChange={e =>
                                  changeEdu(edu.id, { fieldOfStudy: e.target.value })
                              }
                              placeholder="Computer Science, Accounting, Business..."
                          />
                      </Field>

                      <Field label="Location">
                          <TextInput
                              value={edu.location}
                              onChange={e =>
                                  changeEdu(edu.id, { location: e.target.value })
                              }
                              placeholder="Lagos, Nigeria"
                          />
                      </Field>
                  </div>

                  <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12
                  }}>
                      <Field label="Start date">
                          <TextInput
                              type="date"
                              value={edu.startDate}
                              onChange={e =>
                                  changeEdu(edu.id, { startDate: e.target.value })
                              }
                          />
                      </Field>

                      <Field label="End date">
                          <TextInput
                              type="date"
                              value={edu.endDate}
                              disabled={edu.isCurrent}
                              onChange={e =>
                                  changeEdu(edu.id, { endDate: e.target.value })
                              }
                          />
                      </Field>
                  </div>

                  <Field label="Education status">
                      <label style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          fontSize: 14,
                          color: COLORS.text,
                          cursor: 'pointer',
                      }}>
                          <input
                              type="checkbox"
                              checked={edu.isCurrent || false}
                              onChange={e =>
                                  changeEdu(edu.id, {
                                      isCurrent: e.target.checked,
                                      endDate: e.target.checked ? '' : edu.endDate,
                                  })
                              }
                          />
                          I am currently studying here
                      </label>
                  </Field>
                  <div style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      marginTop: 8,
                  }}>
                      <GhostButton
                          onClick={() => saveEducation(edu)}
                          disabled={savingId === edu.id}
                          style={{
                              padding: '10px 18px',
                              whiteSpace: 'nowrap',
                          }}
                      >
                          {savingId === edu.id ? 'Saving...' : 'Save Education'}
                      </GhostButton>
                  </div>
              </>
          )}
      />
  );
}
export async function generateCoverLetter(cvId, jobDescription) {
    const response = await fetch(
        `${API_URL}/CoverLetter/generate`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                cvId,
                jobDescription,
            }),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to generate cover letter.');
    }

    return await response.json();
}

// ---------- Live Preview ----------

function Preview({ data, theme }) {
    const t = THEMES[theme] || THEMES.classic;

    const fullName = data.fullName || data.name || '';
    const professionalTitle =
        data.professionalTitle ||
        data.title ||
        '';

    const shortBio =
        data.shortBio ||
        data.bio ||
        '';

    return (
        <div
            className={`cv-preview cv-preview-${theme}`}
            style={{
                background: t.bg,
                color: t.text,
                fontFamily: t.body,
                padding: '48px 44px',
                minHeight: 500,
                borderRadius: '0 0 14px 14px',
            }}
        >

            {/* HEADER */}
            <div
                className="preview-header"
                style={{
                    marginBottom: 28,
                    textAlign: 'center',
                }}
            >
                <div
                    className="preview-name"
                    style={{
                        fontFamily: t.display,
                        fontWeight: 700,
                        fontSize: 27,
                        letterSpacing: -0.5,
                        color: t.text,
                    }}
                >
                    {fullName || 'Your Name'}
                </div>

                <div
                    className="preview-title"
                    style={{
                        fontSize: 15,
                        color: t.accent,
                        fontWeight: 600,
                        marginTop: 4,
                    }}
                >
                    {professionalTitle || 'Your Professional Title'}
                </div>

                <div
                    className="preview-contact"
                    style={{
                        display: 'flex',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                        gap: '8px 20px',
                        marginTop: 12,
                        fontSize: 13,
                    }}
                >
                    {data.email && (
                        <span style={{ color: t.muted }}>
              {data.email}
            </span>
                    )}

                    {data.phone && (
                        <span style={{ color: t.muted }}>
              • {data.phone}
            </span>
                    )}

                    {data.location && (
                        <span style={{ color: t.muted }}>
              • {data.location}
            </span>
                    )}

                    {data.linkedInUrl && (
                        <span style={{ color: t.accent }}>
              • LinkedIn
            </span>
                    )}

                    {data.gitHubUrl && (
                        <span style={{ color: t.accent }}>
              • GitHub
            </span>
                    )}
                </div>
            </div>


            {/* SUMMARY */}
            {shortBio && (
                <div
                    className="preview-summary"
                    style={{
                        fontSize: 14.5,
                        lineHeight: 1.65,
                        color: t.muted,
                        marginBottom: 30,
                    }}
                >
                    {shortBio}
                </div>
            )}


            {/* EXPERIENCE */}
            {data.experience?.length > 0 && (
                <div
                    className="preview-section"
                    style={{ marginBottom: 32 }}
                >
                    <div
                        className="preview-section-title"
                        style={{
                            fontFamily: t.display,
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: t.accent,
                            marginBottom: 14,
                        }}
                    >
                        Experience
                    </div>

                    {data.experience.map((exp, index) => (
                        <div
                            key={exp.id || index}
                            style={{ marginBottom: 18 }}
                        >
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'baseline',
                                    flexWrap: 'wrap',
                                    gap: 6,
                                }}
                            >
                                <div
                                    style={{
                                        fontWeight: 700,
                                        fontSize: 15,
                                    }}
                                >
                                    {exp.role || 'Role'}

                                    <span
                                        style={{
                                            fontWeight: 400,
                                            color: t.muted,
                                        }}
                                    >
                    {' '}· {exp.company || 'Company'}
                  </span>
                                </div>

                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: t.muted,
                                        fontFamily: t.mono,
                                    }}
                                >
                                    {exp.start}

                                    {exp.start &&
                                        (exp.end || exp.isCurrent) &&
                                        ' — '}

                                    {exp.isCurrent
                                        ? 'Present'
                                        : exp.end}
                                </div>
                            </div>

                            {exp.location && (
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: t.muted,
                                        marginTop: 3,
                                    }}
                                >
                                    {exp.location}
                                </div>
                            )}

                            {exp.bullets?.length > 0 && (
                                <ul
                                    style={{
                                        margin: '8px 0 0',
                                        paddingLeft: 18,
                                        fontSize: 13.5,
                                        color: t.muted,
                                        lineHeight: 1.6,
                                    }}
                                >
                                    {exp.bullets
                                        .filter(Boolean)
                                        .map((bullet, i) => (
                                            <li key={i}>{bullet}</li>
                                        ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}


            {/* SKILLS */}
            {data.skills?.length > 0 && (
                <div
                    className="preview-section"
                    style={{ marginBottom: 32 }}
                >
                    <div
                        className="preview-section-title"
                        style={{
                            fontFamily: t.display,
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: t.accent,
                            marginBottom: 12,
                        }}
                    >
                        Skills
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 8,
                        }}
                    >
                        {data.skills.map((skill, index) => (
                            <span
                                key={skill.id || index}
                                style={{
                                    background: t.surface,
                                    border: `1px solid ${t.border}`,
                                    borderRadius: 999,
                                    padding: '5px 14px',
                                    fontSize: 12.5,
                                    color: t.text,
                                }}
                            >
                {skill.name}
              </span>
                        ))}
                    </div>
                </div>
            )}


            {/* PROJECTS */}
            {data.projects?.length > 0 && (
                <div
                    className="preview-section"
                    style={{ marginBottom: 32 }}
                >
                    <div
                        className="preview-section-title"
                        style={{
                            fontFamily: t.display,
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: t.accent,
                            marginBottom: 14,
                        }}
                    >
                        Projects
                    </div>

                    {data.projects.map((project, index) => (
                        <div
                            key={project.id || index}
                            style={{
                                background: t.surface,
                                border: `1px solid ${t.border}`,
                                borderRadius: 12,
                                padding: 16,
                                marginBottom: 12,
                            }}
                        >
                            <div
                                style={{
                                    fontWeight: 700,
                                    fontSize: 14.5,
                                    marginBottom: 6,
                                }}
                            >
                                {project.title || 'Project title'}
                            </div>

                            {project.role && (
                                <div
                                    style={{
                                        fontSize: 12.5,
                                        color: t.accent,
                                        marginBottom: 6,
                                    }}
                                >
                                    {project.role}
                                </div>
                            )}

                            {project.description && (
                                <div
                                    style={{
                                        fontSize: 13,
                                        color: t.muted,
                                        lineHeight: 1.55,
                                    }}
                                >
                                    {project.description}
                                </div>
                            )}

                            {project.tags && (
                                <div
                                    style={{
                                        marginTop: 8,
                                        fontSize: 11.5,
                                        color: t.accent2,
                                    }}
                                >
                                    {project.tags}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}


            {/* EDUCATION */}
            {data.education?.length > 0 && (
                <div className="preview-section">
                    <div
                        className="preview-section-title"
                        style={{
                            fontFamily: t.display,
                            fontWeight: 700,
                            fontSize: 13,
                            letterSpacing: 1.2,
                            textTransform: 'uppercase',
                            color: t.accent,
                            marginBottom: 14,
                        }}
                    >
                        Education
                    </div>

                    {data.education.map((edu, index) => (
                        <div
                            key={edu.id || index}
                            style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 14,
                                marginBottom: 8,
                                flexWrap: 'wrap',
                                gap: 6,
                            }}
                        >
                            <div>
                <span style={{ fontWeight: 700 }}>
                  {edu.degree || 'Degree'}
                </span>

                                <span style={{ color: t.muted }}>
                  {' '}· {edu.school || 'School'}
                </span>
                            </div>

                            <div
                                style={{
                                    color: t.muted,
                                    fontFamily: t.mono,
                                    fontSize: 12.5,
                                }}
                            >
                                {edu.year ||
                                    edu.endDate ||
                                    ''}
                            </div>
                        </div>
                    ))}
                </div>
            )}

        </div>
    );
}

function BrowserFrame({ data, theme }) {
  const slug = slugify(data.name);
  return (
      <div style={{
        borderRadius: 14, overflow: 'hidden', border: `1px solid ${COLORS.border}`,
        boxShadow: '0 30px 60px -25px rgba(0,0,0,0.6)',
      }}>
        <div style={{
          background: '#1B2340', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FF5F57' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#FEBC2E' }} />
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28C840' }} />
          </div>
          <div style={{
            flex: 1, background: '#0D1226', borderRadius: 7, padding: '6px 14px',
            fontFamily: 'JetBrains Mono, monospace', fontSize: 12.5, color: COLORS.muted,
          }}>
            {slug}.folio.dev
          </div>
        </div>
        <Preview data={data} theme={theme} />
      </div>
  );
}

// ---------- Main App ----------
function getInitials(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map(word => word[0]?.toUpperCase())
        .join('');
}
function AnalyticsCard({ title, value }) {
    return (
        <div
            style={{
                padding: 16,
                borderRadius: 12,
                background: COLORS.surface2,
                border: `1px solid ${COLORS.border}`,
            }}
        >
            <div
                style={{
                    fontSize: 12,
                    color: COLORS.muted,
                }}
            >
                {title}
            </div>

            <div
                style={{
                    fontSize: 28,
                    fontWeight: 700,
                    marginTop: 6,
                }}
            >
                {value}
            </div>
        </div>
    );
}
function AdminLoginPanel({
                             adminUsername,
                             setAdminUsername,
                             adminPassword,
                             setAdminPassword,
                             adminLoginError,
                             handleAdminLogin,
                         }) {
    return (
        <div
            style={{
                marginBottom: 30,
                padding: 24,
                borderRadius: 16,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
            }}
        >
            <div
                style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 20,
                    fontWeight: 700,
                    marginBottom: 6,
                }}
            >
                Admin Analytics
            </div>

            <div
                style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    marginBottom: 20,
                }}
            >
                Sign in to view CVBuilder analytics.
            </div>

            <input
                type="text"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                placeholder="Admin username"
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: 12,
                    marginBottom: 10,
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface2,
                    color: COLORS.text,
                    outline: 'none',
                }}
            />

            <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin password"
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        handleAdminLogin();
                    }
                }}
                style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 10,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.surface2,
                    color: COLORS.text,
                    outline: 'none',
                }}
            />

            <PrimaryButton
                onClick={handleAdminLogin}
                style={{
                    width: '100%',
                    justifyContent: 'center',
                }}
            >
                Login to Analytics
            </PrimaryButton>

            {adminLoginError && (
                <div
                    style={{
                        marginTop: 12,
                        color: COLORS.danger,
                        fontSize: 12,
                    }}
                >
                    {adminLoginError}
                </div>
            )}
        </div>
    );
}

function AnalyticsPanel({
                            analyticsToday,
                            analyticsAllTime,
                            loadingAnalytics,
                            handleAdminLogout,
                        }) {
    return (
        <div
            style={{
                marginBottom: 30,
                padding: 24,
                borderRadius: 16,
                background: COLORS.surface,
                border: `1px solid ${COLORS.border}`,
            }}
        >
            <div
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 16,
                    marginBottom: 6,
                }}
            >
                <div
                    style={{
                        fontFamily: "'Space Grotesk', sans-serif",
                        fontSize: 20,
                        fontWeight: 700,
                    }}
                >
                    CVBuilder Analytics
                </div>

                <GhostButton
                    onClick={handleAdminLogout}
                >
                    Logout
                </GhostButton>
            </div>

            <div
                style={{
                    color: COLORS.muted,
                    fontSize: 13,
                    marginBottom: 20,
                }}
            >
                Track how people are using your CVBuilder.
            </div>

            {loadingAnalytics ? (
                <div
                    style={{
                        color: COLORS.muted,
                        fontSize: 13,
                    }}
                >
                    Loading analytics...
                </div>
            ) : (
                <>
                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 12,
                        }}
                    >
                        Today
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(3, minmax(0, 1fr))',
                            gap: 12,
                            marginBottom: 24,
                        }}
                    >
                        <AnalyticsCard
                            title="CVs Started"
                            value={analyticsToday?.cvStarted ?? 0}
                        />

                        <AnalyticsCard
                            title="CVs Downloaded"
                            value={analyticsToday?.cvDownloaded ?? 0}
                        />

                        <AnalyticsCard
                            title="Cover Letters"
                            value={
                                analyticsToday?.coverLettersGenerated ?? 0
                            }
                        />
                    </div>

                    <div
                        style={{
                            fontSize: 14,
                            fontWeight: 700,
                            marginBottom: 12,
                        }}
                    >
                        All Time
                    </div>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns:
                                'repeat(3, minmax(0, 1fr))',
                            gap: 12,
                        }}
                    >
                        <AnalyticsCard
                            title="Total CVs Started"
                            value={
                                analyticsAllTime?.totalCvStarted ?? 0
                            }
                        />

                        <AnalyticsCard
                            title="Total Downloads"
                            value={
                                analyticsAllTime?.totalCvDownloaded ?? 0
                            }
                        />

                        <AnalyticsCard
                            title="Total Cover Letters"
                            value={
                                analyticsAllTime?.totalCoverLettersGenerated ?? 0
                            }
                        />
                    </div>
                </>
            )}
        </div>
    );
}

export default function CVBuilder() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState(EMPTY_DATA);
    const [theme, setTheme] = useState('classic');
    const [saveState, setSaveState] = useState('idle');
    const [loaded, setLoaded] = useState(false);
    const [cvId, setCvId] = useState(null);
    const [jobDescription, setJobDescription] = useState('');
    const [coverLetter, setCoverLetter] = useState('');
    const [generatingCoverLetter, setGeneratingCoverLetter] = useState(false);
    const [coverLetterError, setCoverLetterError] = useState('');
    const saveTimer = useRef(null);
    const [analyticsToday, setAnalyticsToday] = useState(null);
    const [analyticsAllTime, setAnalyticsAllTime] = useState(null);
    const [loadingAnalytics, setLoadingAnalytics] = useState(false);
    const [adminToken, setAdminToken] = useState(
        localStorage.getItem('cvbuilder_admin_token')
    );

    const [adminUsername, setAdminUsername] = useState('');
    const [adminPassword, setAdminPassword] = useState('');
    const [adminLoginError, setAdminLoginError] = useState('');

  useEffect(() => { ensureFonts(); }, []);

  // Load draft on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
          const savedDraft = localStorage.getItem('cv-builder-draft');

          if (!cancelled && savedDraft) {
              const parsed = JSON.parse(savedDraft);

              if (parsed.data) {
                  setData({
                      ...EMPTY_DATA,
                      ...parsed.data,
                  });
              }

              if (parsed.theme) {
                  setTheme(parsed.theme);
              }

              if (parsed.cvId) {
                  setCvId(parsed.cvId);
              }
          }
      } catch (e) {
        // no existing draft, start fresh
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

    useEffect(() => {
        if (!loaded) return;

        const trackCvStarted = async () => {
            try {
                let visitorId = localStorage.getItem('cv-builder-visitor-id');

                if (!visitorId) {
                    visitorId = crypto.randomUUID();
                    localStorage.setItem('cv-builder-visitor-id', visitorId);
                }

                const today = new Date().toISOString().split('T')[0];
                const lastTracked = localStorage.getItem('cv-builder-started-date');

                if (lastTracked === today) {
                    return;
                }

                await fetch(`${API_URL}/Analytics/event`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        eventType: 'CV_STARTED',
                        visitorId: visitorId,
                        cvId: cvId || null,
                    }),
                });

                localStorage.setItem('cv-builder-started-date', today);

            } catch (error) {
                console.error('CV started tracking failed:', error);
            }
        };

        trackCvStarted();
    }, [loaded]);

  // Debounced autosave
    useEffect(() => {
        if (!loaded) return;

        setSaveState('saving');

        if (saveTimer.current) {
            clearTimeout(saveTimer.current);
        }

        saveTimer.current = setTimeout(async () => {
            try {
                const cvData = mapDataToCv(data);

                let currentCvId = cvId;

                // Save to backend
                if (!currentCvId) {
                    const result = await createCv(cvData);

                    currentCvId = result.id;
                    setCvId(currentCvId);
                } else {
                    await updateCv(currentCvId, cvData);
                }

                // IMPORTANT:
                // Save a local draft so refresh does not erase the form
                localStorage.setItem(
                    'cv-builder-draft',
                    JSON.stringify({
                        data,
                        theme,
                        cvId: currentCvId,
                    })
                );

                setSaveState('saved');

            } catch (error) {
                console.error("AUTO SAVE ERROR:", error);
                setSaveState('error');
            }
        }, 700);

        return () => {
            if (saveTimer.current) {
                clearTimeout(saveTimer.current);
            }
        };
    }, [data, theme, loaded, cvId]);
  const update = useCallback((patch) => setData(d => ({ ...d, ...patch })), []);

    const handleGenerateCoverLetter = async () => {
        if (!jobDescription.trim()) {
            setCoverLetterError('Please paste a job description first.');
            return;
        }

        if (!cvId) {
            setCoverLetterError(
                'Please wait for your CV to finish saving before generating a cover letter.'
            );
            return;
        }

        try {
            setGeneratingCoverLetter(true);
            setCoverLetterError('');
            setCoverLetter('');

            const result = await generateCoverLetter(
                cvId,
                jobDescription
            );

            setCoverLetter(result.coverLetter || '');

            await fetch(`${API_URL}/Analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventType: 'COVER_LETTER_GENERATED',
                    visitorId: getVisitorId(),
                    cvId: cvId,
                }),
            });
        } catch (error) {
            console.error('COVER LETTER ERROR:', error);

            setCoverLetterError(
                error.message || 'Unable to generate cover letter.'
            );
        } finally {
            setGeneratingCoverLetter(false);
        }
    };
    const handleAdminLogin = async () => {
        try {
            setAdminLoginError('');

            const result = await adminLogin(
                adminUsername,
                adminPassword
            );

            localStorage.setItem(
                'cvbuilder_admin_token',
                result.token
            );

            setAdminToken(result.token);

            setAdminUsername('');
            setAdminPassword('');
        } catch (error) {
            console.error('Admin login failed:', error);

            setAdminLoginError(
                error.message || 'Unable to login.'
            );
        }
    };
    const handleAdminLogout = () => {
        localStorage.removeItem('cvbuilder_admin_token');

        setAdminToken(null);
        setAnalyticsToday(null);
        setAnalyticsAllTime(null);
    };

    const loadAnalytics = async () => {
        if (!adminToken) {
            return;
        }

        try {
            setLoadingAnalytics(true);

            const headers = {
                Authorization: `Bearer ${adminToken}`,
            };

            const [todayResponse, allTimeResponse] = await Promise.all([
                fetch(`${API_URL}/Analytics/summary`, {
                    headers,
                }),
                fetch(`${API_URL}/Analytics/all-time`, {
                    headers,
                }),
            ]);

            if (!todayResponse.ok || !allTimeResponse.ok) {
                throw new Error('Failed to load analytics.');
            }

            const today = await todayResponse.json();
            const allTime = await allTimeResponse.json();

            setAnalyticsToday(today);
            setAnalyticsAllTime(allTime);
        } catch (error) {
            console.error('Analytics error:', error);
        } finally {
            setLoadingAnalytics(false);
        }
    };
    useEffect(() => {
        loadAnalytics();
    }, [adminToken]);
    const handleDownloadCoverLetter = () => {
        if (!coverLetter) {
            return;
        }

        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
        });

        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 22;
        const contentWidth = pageWidth - margin * 2;

        let y = margin;

        const lines = coverLetter.split('\n');

        // ---------- Typography ----------
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(11);
        pdf.setTextColor(30, 30, 30);

        const lineHeight = 6;

        lines.forEach((line) => {
            const trimmedLine = line.trim();

            // Blank line = paragraph spacing
            if (!trimmedLine) {
                y += 5;
                return;
            }

            const wrappedLines = pdf.splitTextToSize(
                trimmedLine,
                contentWidth
            );

            // New page when content reaches bottom margin
            if (
                y + wrappedLines.length * lineHeight >
                pageHeight - margin
            ) {
                pdf.addPage();
                y = margin;
            }

            pdf.text(
                wrappedLines,
                margin,
                y
            );

            y += wrappedLines.length * lineHeight;
        });

        // ---------- Filename ----------
        const firstLine = coverLetter
            .split('\n')
            .map(line => line.trim())
            .find(Boolean);

        const fileName = firstLine
            ? firstLine
                .replace(/[^a-z0-9]/gi, '-')
                .replace(/-+/g, '-')
            : 'Cover-Letter';

        pdf.save(`${fileName}-Cover-Letter.pdf`);
    };
    const handlePrint = async () => {
        try {
            let visitorId = localStorage.getItem('cv-builder-visitor-id');

            if (!visitorId) {
                visitorId = crypto.randomUUID();
                localStorage.setItem('cv-builder-visitor-id', visitorId);
            }

            await fetch(`${API_URL}/Analytics/event`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    eventType: 'CV_DOWNLOADED',
                    visitorId: visitorId,
                    cvId: cvId || null,
                }),
            });
        } catch (error) {
            console.error('Analytics tracking failed:', error);
        }

        window.print();
    };

  const StepIcon = STEPS[step].icon;

    return (
        <div style={{ background: COLORS.bg, minHeight: '100vh', fontFamily: 'Inter, sans-serif', color: COLORS.text }}>

            <div className="no-print">
                {adminToken ? (
                    <AnalyticsPanel
                        analyticsToday={analyticsToday}
                        analyticsAllTime={analyticsAllTime}
                        loadingAnalytics={loadingAnalytics}
                        handleAdminLogout={handleAdminLogout}
                    />
                ) : (
                    <AdminLoginPanel
                        adminUsername={adminUsername}
                        setAdminUsername={setAdminUsername}
                        adminPassword={adminPassword}
                        setAdminPassword={setAdminPassword}
                        adminLoginError={adminLoginError}
                        handleAdminLogin={handleAdminLogin}
                    />
                )}
            </div>

            <style>{`
    #cv-print-document {
        display: none;
    }

    @media print {
    @page {
        size: A4;
        margin: 5mm 0mm;
    }

    html,
    body {
        margin: 0 !important;
        padding: 0 !important;
        background: white !important;
    }

    .no-print {
        display: none !important;
    }

    #print-area {
        display: none !important;
    }

    #cv-print-document {
        display: block !important;
    }

    .cv-page {
        width: auto;
        min-height: auto;
        box-sizing: border-box;
        background: var(--cv-bg, white);
        color: var(--cv-text, #111827);
        padding: 0;
        margin: 0;
        font-size: 10.5pt;
        line-height: 1.45;
    }

    .cv-experience-item,
    .cv-project-item,
    .cv-education-item {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cv-section h3 {
        break-after: avoid;
        page-break-after: avoid;
    }

    input:focus,
    textarea:focus {
        border-color: ${COLORS.violet} !important;
    }

    ::placeholder {
        color: ${COLORS.mutedDark};
    }
}

        .cv-page:last-child {
            page-break-after: auto;
        }

        .cv-section,
        .cv-experience-item,
        .cv-project-item,
        .cv-education-item {
            break-inside: avoid;
            page-break-inside: avoid;
        }

        input:focus,
        textarea:focus {
            border-color: ${COLORS.violet} !important;
        }

        ::placeholder {
            color: ${COLORS.mutedDark};
        }
    }

    .cv-document {
        font-family: Arial, Helvetica, sans-serif;
        background: white;
        color: #202124;
    }

    .cv-page {
    font-size: 10.5pt;
    line-height: 1.45;
    text-align: left;
}

.cv-section {
    margin-top: 18px;
    text-align: left;
}

.cv-summary {
    margin: 0;
    text-align: left;
}

.cv-experience-item,
.cv-project-item,
.cv-education-item {
    margin-bottom: 15px;
    text-align: left;
}

.cv-experience-item ul {
    text-align: left;
}

.cv-project-item p,
.cv-education-item p {
    text-align: left;
}

    .cv-header {
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 22px;
}

.cv-header-main {
    width: 100%;
    text-align: center;
}

    .cv-header-main {
        flex: 1;
        text-align: center;
    }

    .cv-header-main h1 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 26px;
        font-weight: 700;
        color: #111827;
    }

    .cv-header-main h2 {
        margin: 3px 0 8px;
        font-size: 14px;
        font-weight: 700;
        color: #174a7c;
    }

    .cv-contact {
        display: flex;
        justify-content: center;
        flex-wrap: wrap;
        gap: 5px 10px;
        font-size: 9.5pt;
        color: #333;
    }

    .cv-section {
        margin-top: 18px;
    }

    .cv-section h3 {
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        font-size: 13px;
        letter-spacing: 1.5px;
        color: #123f68;
    }

    .cv-section-line {
        height: 1px;
        background: #333;
        margin: 5px 0 12px;
    }

    .cv-summary {
        margin: 0;
        text-align: left;
    }

    .cv-skills {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .cv-experience-item,
    .cv-project-item,
    .cv-education-item {
        margin-bottom: 15px;
    }

    .cv-item-header {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 15px;
    }

    .cv-item-header strong {
        font-size: 11.5pt;
        color: #202124;
    }

    .cv-item-header span {
        font-size: 11.5pt;
    }

    .cv-date {
        white-space: nowrap;
        font-size: 9.5pt;
        color: #444;
    }

    .cv-experience-item p,
    .cv-project-item p,
    .cv-education-item p {
        margin: 5px 0;
    }

    .cv-technologies {
        margin-top: 5px;
        font-size: 9.5pt;
        color: #444;
    }
    /* =========================================================
   CV PRINT THEMES
   ========================================================= */

.cv-document {
    width: 100%;
    background: var(--cv-bg);
    color: var(--cv-text);
    font-family: Arial, Helvetica, sans-serif;
}

.cv-page {
    width: 210mm;
    min-height: 297mm;
    box-sizing: border-box;
    background: var(--cv-bg);
    color: var(--cv-text);
    padding: 15mm 16mm;
    margin: 0;
    font-size: 10.5pt;
    line-height: 1.45;
}


/* =========================================================
   CLASSIC PROFESSIONAL
   ========================================================= */

.cv-theme-classic {
    --cv-bg: #ffffff;
    --cv-text: #202124;
    --cv-muted: #444444;
    --cv-accent: #174a7c;
    --cv-heading: #123f68;
    --cv-line: #333333;
    --cv-surface: #f8fafc;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-classic .cv-header-main h1 {
    font-family: Georgia, "Times New Roman", serif;
    color: #111827;
}

.cv-theme-classic .cv-header-main h2 {
    color: var(--cv-accent);
}

.cv-theme-classic .cv-section h3 {
    color: var(--cv-heading);
}

.cv-theme-classic .cv-section-line {
    background: var(--cv-line);
}


/* =========================================================
   EXECUTIVE NAVY
   ========================================================= */

.cv-theme-executive {
    --cv-bg: #ffffff;
    --cv-text: #1f2937;
    --cv-muted: #4b5563;
    --cv-accent: #0f3d63;
    --cv-heading: #0f3d63;
    --cv-line: #0f3d63;
    --cv-surface: #f8fafc;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-executive .cv-header {
    border-bottom: 3px solid #0f3d63;
    padding-bottom: 14px;
}

.cv-theme-executive .cv-header-main h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 29px;
    color: #0f3d63;
}

.cv-theme-executive .cv-header-main h2 {
    color: #374151;
}

.cv-theme-executive .cv-section h3 {
    color: #0f3d63;
    letter-spacing: 2px;
}

.cv-theme-executive .cv-section-line {
    background: #0f3d63;
}


/* =========================================================
   DARK TECHNICAL
   ========================================================= */

.cv-theme-dark {
    --cv-bg: #0b1020;
    --cv-text: #f8fafc;
    --cv-muted: #aab4cc;
    --cv-accent: #8b7cff;
    --cv-heading: #4adecc;
    --cv-line: #33405f;
    --cv-surface: #151d35;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-dark .cv-page {
    background: #0b1020;
    color: #f8fafc;
}

.cv-theme-dark .cv-header {
    border-bottom: 2px solid #33405f;
    padding-bottom: 14px;
}

.cv-theme-dark .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    color: #f8fafc;
}

.cv-theme-dark .cv-header-main h2 {
    color: #4adecc;
}

.cv-theme-dark .cv-contact {
    color: #aab4cc;
}

.cv-theme-dark .cv-section h3 {
    color: #8b7cff;
}

.cv-theme-dark .cv-section-line {
    background: #33405f;
}

.cv-theme-dark .cv-item-header strong {
    color: #f8fafc;
}

.cv-theme-dark .cv-date,
.cv-theme-dark .cv-technologies {
    color: #aab4cc;
}


/* =========================================================
   CLEAN MINIMAL
   ========================================================= */

.cv-theme-minimal {
    --cv-bg: #ffffff;
    --cv-text: #111827;
    --cv-muted: #6b7280;
    --cv-accent: #374151;
    --cv-heading: #111827;
    --cv-line: #d1d5db;
    --cv-surface: #f9fafb;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-minimal .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 28px;
    font-weight: 700;
    color: #111827;
}

.cv-theme-minimal .cv-header-main h2 {
    color: #6b7280;
    font-weight: 500;
}

.cv-theme-minimal .cv-section h3 {
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    letter-spacing: 1px;
}

.cv-theme-minimal .cv-section-line {
    background: #d1d5db;
}


/* =========================================================
   BOLD CREATIVE
   ========================================================= */

.cv-theme-creative {
    --cv-bg: #ffffff;
    --cv-text: #18181b;
    --cv-muted: #52525b;
    --cv-accent: #ec4899;
    --cv-heading: #ec4899;
    --cv-line: #f59e0b;
    --cv-surface: #fff7ed;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-creative .cv-header {
    border-left: 6px solid #ec4899;
    padding-left: 18px;
}

.cv-theme-creative .cv-header-main {
    text-align: left;
}

.cv-theme-creative .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 30px;
    color: #18181b;
}

.cv-theme-creative .cv-header-main h2 {
    color: #ec4899;
}

.cv-theme-creative .cv-contact {
    justify-content: flex-start;
}

.cv-theme-creative .cv-section h3 {
    color: #ec4899;
    font-family: Arial, Helvetica, sans-serif;
    letter-spacing: 1px;
}

.cv-theme-creative .cv-section-line {
    height: 2px;
    background: #f59e0b;
}


/* =========================================================
   CLASSIC CORPORATE
   ========================================================= */

.cv-theme-corporate {
    --cv-bg: #ffffff;
    --cv-text: #1f2937;
    --cv-muted: #4b5563;
    --cv-accent: #174a7c;
    --cv-heading: #174a7c;
    --cv-line: #174a7c;
    --cv-surface: #f3f6f9;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-corporate .cv-header {
    border-bottom: 4px solid #174a7c;
    padding-bottom: 12px;
}

.cv-theme-corporate .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 27px;
    color: #17324d;
}

.cv-theme-corporate .cv-header-main h2 {
    color: #174a7c;
}

.cv-theme-corporate .cv-section h3 {
    color: #174a7c;
    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-corporate .cv-section-line {
    background: #174a7c;
}


/* =========================================================
   ELEGANT SERIF
   ========================================================= */

.cv-theme-elegant {
    --cv-bg: #ffffff;
    --cv-text: #292524;
    --cv-muted: #57534e;
    --cv-accent: #795548;
    --cv-heading: #5f4034;
    --cv-line: #a8a29e;
    --cv-surface: #fafaf9;

    font-family: Georgia, "Times New Roman", serif;
}

.cv-theme-elegant .cv-header-main h1 {
    font-family: Georgia, "Times New Roman", serif;
    font-size: 30px;
    color: #292524;
}

.cv-theme-elegant .cv-header-main h2 {
    font-family: Georgia, "Times New Roman", serif;
    color: #795548;
}

.cv-theme-elegant .cv-section h3 {
    font-family: Georgia, "Times New Roman", serif;
    color: #5f4034;
    letter-spacing: 2px;
}

.cv-theme-elegant .cv-section-line {
    background: #a8a29e;
}


/* =========================================================
   MODERN SLATE
   ========================================================= */

.cv-theme-modern {
    --cv-bg: #ffffff;
    --cv-text: #1e293b;
    --cv-muted: #64748b;
    --cv-accent: #475569;
    --cv-heading: #334155;
    --cv-line: #94a3b8;
    --cv-surface: #f8fafc;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-modern .cv-header {
    border-left: 5px solid #475569;
    padding-left: 16px;
}

.cv-theme-modern .cv-header-main {
    text-align: left;
}

.cv-theme-modern .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    color: #1e293b;
}

.cv-theme-modern .cv-header-main h2 {
    color: #64748b;
}

.cv-theme-modern .cv-contact {
    justify-content: flex-start;
}

.cv-theme-modern .cv-section h3 {
    color: #334155;
    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-modern .cv-section-line {
    background: #94a3b8;
}


/* =========================================================
   ATS COMPACT
   ========================================================= */

.cv-theme-ats {
    --cv-bg: #ffffff;
    --cv-text: #111111;
    --cv-muted: #333333;
    --cv-accent: #111111;
    --cv-heading: #111111;
    --cv-line: #111111;
    --cv-surface: #ffffff;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-ats .cv-page {
    padding: 12mm 14mm;
    font-size: 10pt;
}

.cv-theme-ats .cv-header {
    margin-bottom: 14px;
}

.cv-theme-ats .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 24px;
    color: #111111;
}

.cv-theme-ats .cv-header-main h2 {
    color: #111111;
    font-size: 13px;
}

.cv-theme-ats .cv-section {
    margin-top: 13px;
}

.cv-theme-ats .cv-section h3 {
    font-family: Arial, Helvetica, sans-serif;
    color: #111111;
    font-size: 12px;
    letter-spacing: 1px;
}

.cv-theme-ats .cv-section-line {
    background: #111111;
}


/* =========================================================
   PROFESSIONAL TEAL
   ========================================================= */

.cv-theme-teal {
    --cv-bg: #ffffff;
    --cv-text: #1f2937;
    --cv-muted: #4b5563;
    --cv-accent: #0f766e;
    --cv-heading: #0f766e;
    --cv-line: #14b8a6;
    --cv-surface: #f0fdfa;

    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-teal .cv-header {
    border-bottom: 3px solid #0f766e;
    padding-bottom: 13px;
}

.cv-theme-teal .cv-header-main h1 {
    font-family: Arial, Helvetica, sans-serif;
    color: #134e4a;
}

.cv-theme-teal .cv-header-main h2 {
    color: #0f766e;
}

.cv-theme-teal .cv-section h3 {
    color: #0f766e;
    font-family: Arial, Helvetica, sans-serif;
}

.cv-theme-teal .cv-section-line {
    background: #14b8a6;
}
`}</style>

        {/* Top bar */}
        <div className="no-print" style={{
          borderBottom: `1px solid ${COLORS.border}`, padding: '18px 32px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: 9,
              background: `linear-gradient(135deg, ${COLORS.violet}, ${COLORS.teal})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#0A0E1A',
            }}>CV</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 17 }}>Folio Builder</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: COLORS.mutedDark }}>
              {saveState === 'saving' && <><Loader2 size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} /> Saving...</>}
              {saveState === 'saved' && <><Check size={13} color={COLORS.teal} /> Draft saved</>}
              {saveState === 'error' && <span style={{ color: COLORS.danger }}>Couldn't save draft</span>}
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        </div>

        {/* Step nav */}
        <div className="no-print" style={{
          display: 'flex', gap: 6, padding: '18px 32px 0', flexWrap: 'wrap',
        }}>
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const active = i === step;
            const done = i < step;
            return (
                <button
                    key={s.key}
                    onClick={() => setStep(i)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      background: active ? COLORS.surface : 'transparent',
                      border: `1px solid ${active ? COLORS.violet : COLORS.border}`,
                      color: active ? COLORS.text : (done ? COLORS.teal : COLORS.muted),
                      borderRadius: 999, padding: '8px 16px 8px 12px', fontSize: 13, fontWeight: 600,
                      cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                    }}
                >
              <span style={{
                width: 20, height: 20, borderRadius: '50%',
                background: done ? COLORS.teal : (active ? COLORS.violet : COLORS.surface2),
                color: done || active ? '#0A0E1A' : COLORS.mutedDark,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
              }}>
                {done ? <Check size={12} /> : i + 1}
              </span>
                  {s.label}
                </button>
            );
          })}
        </div>

        {/* Main content */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'minmax(360px, 480px) 1fr', gap: 32,
          padding: '28px 32px 60px', alignItems: 'start',
        }}>
          <div className="no-print" style={{
            background: COLORS.surface, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
              <StepIcon size={19} color={COLORS.teal} />
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 700, fontSize: 19 }}>{STEPS[step].label}</div>
            </div>

            {step === 0 && <BasicsStep data={data} update={update} />}
            {step === 1 && <SkillsStep
                data={data}
                update={update}
                cvId={cvId}
            />}
              {step === 2 && (
                  <ExperienceStep
                      data={data}
                      update={update}
                      cvId={cvId}
                  />
              )}
              {step === 3 && (
                  <ProjectsStep
                      data={data}
                      update={update}
                      cvId={cvId}
                  />
              )}
              {step === 4 && (
                  <EducationStep
                      data={data}
                      update={update}
                      cvId={cvId}
                  />
              )}
              {step === 5 && (
                  <div>
                      <div style={{
                          fontSize: 14,
                          color: COLORS.muted,
                          lineHeight: 1.6,
                          marginBottom: 22,
                      }}>
                          Your CV is ready. Choose a professional template and export it when you're satisfied with the preview.
                      </div>

                      <div style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 12,
                      }}>
                          Choose a template
                      </div>

                      <div style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr',
                          gap: 12,
                          marginBottom: 26,
                      }}>
                          {Object.values(THEMES).map(t => (
                              <button
                                  key={t.key}
                                  onClick={() => setTheme(t.key)}
                                  style={{
                                      textAlign: 'left',
                                      cursor: 'pointer',
                                      borderRadius: 12,
                                      padding: 14,
                                      background: COLORS.surface2,
                                      border: `1.5px solid ${
                                          theme === t.key
                                              ? COLORS.violet
                                              : COLORS.border
                                      }`,
                                      transition: 'border-color 0.2s ease',
                                  }}
                              >
                                  <div style={{
                                      display: 'flex',
                                      gap: 5,
                                      marginBottom: 10,
                                  }}>
                                      {t.swatch.map((c, i) => (
                                          <div
                                              key={i}
                                              style={{
                                                  width: 16,
                                                  height: 16,
                                                  borderRadius: 4,
                                                  background: c,
                                                  border: `1px solid ${COLORS.border}`,
                                              }}
                                          />
                                      ))}
                                  </div>

                                  <div style={{
                                      fontWeight: 700,
                                      fontSize: 13.5,
                                      color: COLORS.text,
                                  }}>
                                      {t.name}
                                  </div>

                                  <div style={{
                                      fontSize: 11.5,
                                      color: COLORS.mutedDark,
                                      marginTop: 2,
                                  }}>
                                      {t.desc}
                                  </div>
                              </button>

                          ))}
                      </div>

                      <div style={{
                          fontFamily: "'Space Grotesk', sans-serif",
                          fontWeight: 700,
                          fontSize: 14,
                          marginBottom: 12,
                      }}>
                          Export your CV
                      </div>

                      <PrimaryButton
                          onClick={handlePrint}
                          style={{
                              width: '100%',
                              marginBottom: 10,
                          }}
                      >
                          <Download size={16} />
                          Download as PDF
                      </PrimaryButton>

                      <GhostButton
                          onClick={handlePrint}
                          style={{
                              width: '100%',
                              justifyContent: 'center',
                          }}
                      >
                          Print CV
                      </GhostButton>

                      <div
                          style={{
                              fontSize: 12,
                              color: COLORS.muted,
                              marginBottom: 20,
                              lineHeight: 1.5,
                          }}
                      >
                          Your CV will open in your browser's print dialog.
                          Choose <strong>Save as PDF</strong> to download it.
                      </div>

                      <div
                          style={{
                              marginTop: 30,
                              paddingTop: 24,
                              borderTop: `1px solid ${COLORS.border}`,
                          }}
                      >
                          <div
                              style={{
                                  fontFamily: "'Space Grotesk', sans-serif",
                                  fontWeight: 700,
                                  fontSize: 16,
                                  marginBottom: 8,
                              }}
                          >
                              Generate Cover Letter
                          </div>

                          <div
                              style={{
                                  fontSize: 12.5,
                                  color: COLORS.muted,
                                  lineHeight: 1.5,
                                  marginBottom: 14,
                              }}
                          >
                              Paste the job description below and generate a personalized
                              cover letter using the information in your CV.
                          </div>

                          <textarea
                              value={jobDescription}
                              onChange={(e) => setJobDescription(e.target.value)}
                              placeholder="Paste the job description here..."
                              rows={10}
                              style={{
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  resize: 'vertical',
                                  borderRadius: 10,
                                  border: `1px solid ${COLORS.border}`,
                                  background: COLORS.surface2,
                                  color: COLORS.text,
                                  padding: 12,
                                  fontFamily: 'Inter, sans-serif',
                                  fontSize: 13,
                                  lineHeight: 1.5,
                                  outline: 'none',
                              }}
                          />

                          <PrimaryButton
                              onClick={handleGenerateCoverLetter}
                              disabled={
                                  generatingCoverLetter ||
                                  !jobDescription.trim()
                              }
                              style={{
                                  width: '100%',
                                  marginTop: 12,
                              }}
                          >
                              {generatingCoverLetter
                                  ? 'Generating Cover Letter...'
                                  : 'Generate Cover Letter'}
                          </PrimaryButton>

                          {coverLetterError && (
                              <div
                                  style={{
                                      marginTop: 12,
                                      color: COLORS.danger,
                                      fontSize: 12,
                                      lineHeight: 1.5,
                                  }}
                              >
                                  {coverLetterError}
                              </div>
                          )}

                          {coverLetter && (
                              <div style={{ marginTop: 20 }}>
                                  <div
                                      style={{
                                          fontFamily: "'Space Grotesk', sans-serif",
                                          fontWeight: 700,
                                          fontSize: 14,
                                          marginBottom: 8,
                                      }}
                                  >
                                      Your Cover Letter
                                  </div>

                                  <textarea
                                      value={coverLetter}
                                      onChange={(e) =>
                                          setCoverLetter(e.target.value)
                                      }
                                      rows={18}
                                      style={{
                                          width: '100%',
                                          boxSizing: 'border-box',
                                          resize: 'vertical',
                                          borderRadius: 10,
                                          border: `1px solid ${COLORS.border}`,
                                          background: COLORS.surface2,
                                          color: COLORS.text,
                                          padding: 14,
                                          fontFamily: 'Arial, sans-serif',
                                          fontSize: 13,
                                          lineHeight: 1.6,
                                          outline: 'none',
                                      }}
                                  />

                                  <GhostButton
                                      onClick={() =>
                                          navigator.clipboard.writeText(coverLetter)
                                      }
                                      style={{
                                          width: '100%',
                                          justifyContent: 'center',
                                          marginTop: 10,
                                      }}
                                  >
                                      Copy Cover Letter
                                  </GhostButton>

                                  <GhostButton
                                      onClick={handleDownloadCoverLetter}
                                      style={{
                                          width: '100%',
                                          justifyContent: 'center',
                                          marginTop: 10,
                                      }}
                                  >
                                      Download Cover Letter
                                  </GhostButton>
                              </div>
                          )}
                      </div>
                  </div>
              )}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 26, paddingTop: 22, borderTop: `1px solid ${COLORS.border}` }}>
              <GhostButton onClick={() => setStep(s => Math.max(0, s - 1))} style={{ visibility: step === 0 ? 'hidden' : 'visible' }}>
                <ChevronLeft size={16} /> Back
              </GhostButton>
              {step < STEPS.length - 1 && (
                  <PrimaryButton onClick={() => setStep(s => Math.min(STEPS.length - 1, s + 1))}>
                    Next <ChevronRight size={16} />
                  </PrimaryButton>
              )}
            </div>
          </div>

            <div
                id="print-area"
                style={{
                    position: 'sticky',
                    top: 24,
                }}
            >
                <BrowserFrame data={data} theme={theme} />
            </div>

            <div id="cv-print-document">
                <CVPrintDocument
                    data={data}
                    theme={theme}
                />
            </div>
        </div>
      </div>
  );

}
function CVPrintDocument({ data, theme }) {
    const fullName = data.fullName || data.name || '';
    const professionalTitle =
        data.professionalTitle ||
        data.title ||
        '';

    return (
        <div className={`cv-document cv-theme-${theme}`}>
            <div className="cv-page">

                {/* HEADER */}
                <div className="cv-header">
                    <div className="cv-header-main">
                        <h1>{fullName || 'Your Name'}</h1>

                        <h2>
                            {professionalTitle || 'Professional Title'}
                        </h2>

                        <div className="cv-contact">
                            {data.email && <span>{data.email}</span>}
                            {data.phone && <span>• {data.phone}</span>}
                            {data.location && <span>• {data.location}</span>}
                            {data.linkedInUrl && <span>• LinkedIn</span>}
                            {data.gitHubUrl && <span>• GitHub</span>}
                        </div>
                    </div>
                </div>

                {/* PROFESSIONAL SUMMARY */}
                {(data.shortBio || data.bio) && (
                    <section className="cv-section">
                        <h3>PROFESSIONAL SUMMARY</h3>
                        <div className="cv-section-line" />

                        <p className="cv-summary">
                            {data.shortBio || data.bio}
                        </p>
                    </section>
                )}
                {/* SKILLS */}
                {data.skills?.length > 0 && (
                    <section className="cv-section">
                        <h3>SKILLS</h3>
                        <div className="cv-section-line" />

                        <div className="cv-skills">
                            {data.skills.map((skill, index) => (
                                <div key={skill.id || index}>
                                    <strong>{skill.name}</strong>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* PROFESSIONAL EXPERIENCE */}
                {data.experience?.length > 0 && (
                    <section className="cv-section">
                        <h3>PROFESSIONAL EXPERIENCE</h3>
                        <div className="cv-section-line" />

                        {data.experience.map((exp, index) => (
                            <div
                                key={exp.id || index}
                                className="cv-experience-item"
                            >
                                <div className="cv-item-header">
                                    <div>
                                        <strong>{exp.role}</strong>

                                        {exp.company && (
                                            <span> — {exp.company}</span>
                                        )}
                                    </div>

                                    <div className="cv-date">
                                        {exp.start}
                                        {exp.start &&
                                        (exp.isCurrent || exp.end)
                                            ? ' – '
                                            : ''}
                                        {exp.isCurrent
                                            ? 'Present'
                                            : exp.end}
                                    </div>
                                </div>

                                {exp.location && (
                                    <div className="cv-technologies">
                                        {exp.location}
                                    </div>
                                )}

                                {exp.bullets?.length > 0 && (
                                    <ul
                                        style={{
                                            margin: '6px 0 0 18px',
                                            padding: 0,
                                        }}
                                    >
                                        {exp.bullets
                                            .filter(b => b?.trim())
                                            .map((bullet, bulletIndex) => (
                                                <li
                                                    key={bulletIndex}
                                                    style={{
                                                        marginBottom: 3,
                                                    }}
                                                >
                                                    {bullet}
                                                </li>
                                            ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* PROJECTS */}
                {data.projects?.length > 0 && (
                    <section className="cv-section">
                        <h3>PROJECTS</h3>
                        <div className="cv-section-line" />

                        {data.projects.map((project, index) => (
                            <div
                                key={project.id || index}
                                className="cv-project-item"
                            >
                                <div className="cv-item-header">
                                    <div>
                                        <strong>{project.title}</strong>

                                        {project.role && (
                                            <span> — {project.role}</span>
                                        )}
                                    </div>
                                </div>

                                {project.description && (
                                    <p>
                                        {project.description}
                                    </p>
                                )}

                                {project.tags && (
                                    <div className="cv-technologies">
                                        <strong>Technologies:</strong>{' '}
                                        {project.tags}
                                    </div>
                                )}

                                {project.link && (
                                    <div className="cv-technologies">
                                        <strong>Project:</strong>{' '}
                                        {project.link}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}

                {/* EDUCATION */}
                {data.education?.length > 0 && (
                    <section className="cv-section">
                        <h3>EDUCATION</h3>
                        <div className="cv-section-line" />

                        {data.education.map((edu, index) => (
                            <div
                                key={edu.id || index}
                                className="cv-education-item"
                            >
                                <div className="cv-item-header">
                                    <div>
                                        <strong>{edu.school}</strong>

                                        {edu.degree && (
                                            <span> — {edu.degree}</span>
                                        )}
                                    </div>

                                    {(edu.startDate ||
                                        edu.endDate ||
                                        edu.isCurrent) && (
                                        <span className="cv-date">
                                            {edu.startDate || ''}
                                            {' — '}
                                            {edu.isCurrent
                                                ? 'Present'
                                                : edu.endDate || ''}
                                        </span>
                                    )}
                                </div>

                                {edu.fieldOfStudy && (
                                    <p>
                                        {edu.fieldOfStudy}
                                    </p>
                                )}

                                {edu.location && (
                                    <div className="cv-technologies">
                                        {edu.location}
                                    </div>
                                )}
                            </div>
                        ))}
                    </section>
                )}

            </div>
        </div>
    );
}
