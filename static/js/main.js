// DOM Elements
const timeline = document.getElementById('timeline');
const patientName = document.getElementById('patient-name');
const patientAge = document.getElementById('patient-age');
const patientSex = document.getElementById('patient-sex');
const encounterDetails = document.getElementById('encounter-details');
const fileUpload = document.getElementById('file-upload');
const fetchApiBtn = document.getElementById('fetch-api');
const uploadModal = document.getElementById('upload-modal');
const uploadMessage = document.getElementById('upload-message');
const medicationsList = document.getElementById('medications-list');
const diagnosesList = document.getElementById('diagnoses-list');
const diagnosisChangesList = document.getElementById('diagnosis-changes');
const medicationChangesList = document.getElementById('medication-changes');
const medicationModal = document.getElementById('medication-modal');
const medRegularYes = document.getElementById('med-regular-yes');
const medRegularNo = document.getElementById('med-regular-no');
const tabButtons = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const sidePanel = document.getElementById('side-panel');
const backToTopBtn = document.getElementById('back-to-top');
const mainContent = document.querySelector('main');

// State variables
let timelineData = [];
let medicationsInUse = [];
let patientDiagnoses = [];
let currentPatient = null;
let currentMedication = null;
let diagnosisChanges = [];
let medicationChanges = [];
let touchStartY = 0;
let touchEndY = 0;
let isMobile = window.innerWidth <= 768;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    loadTimeline();
    loadMedicationsInUse();
    loadDiagnoses();
    loadChanges();
    setupEventListeners();
    setupTabs();
    initMobileFeatures();
});

// Set up event listeners
function setupEventListeners() {
    // File upload
    fileUpload.addEventListener('change', handleFileUpload);
    
    // API fetch button
    fetchApiBtn.addEventListener('click', fetchFromApi);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            uploadModal.style.display = 'none';
            medicationModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === uploadModal) {
            uploadModal.style.display = 'none';
        }
        if (event.target === medicationModal) {
            medicationModal.style.display = 'none';
        }
    });
    
    // Medication modal buttons
    medRegularYes.addEventListener('click', () => {
        if (currentMedication) {
            addMedicationToRegularUse(currentMedication, true);
        }
        medicationModal.style.display = 'none';
    });
    
    medRegularNo.addEventListener('click', () => {
        if (currentMedication) {
            addMedicationToRegularUse(currentMedication, false);
        }
        medicationModal.style.display = 'none';
    });
}

// Setup tabs functionality
function setupTabs() {
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and content
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Add active class to clicked button and corresponding content
            button.classList.add('active');
            const tabId = button.dataset.tab;
            document.getElementById(`${tabId}-tab`).classList.add('active');
            
            // Hide all content in main area except the active tab
            tabContents.forEach(content => {
                if (content.id === `${tabId}-tab`) {
                    content.style.display = 'block';
                } else {
                    content.style.display = 'none';
                }
            });
        });
    });
    
    // Initialize with only timeline tab visible
    tabContents.forEach(content => {
        if (content.id === 'timeline-tab') {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    });
}

// Initialize mobile features
function initMobileFeatures() {
    if (!isMobile) return;
    
    // Add swipe functionality to side panel
    const handleEl = document.querySelector('.side-panel-handle');
    
    if (handleEl) {
        handleEl.addEventListener('touchstart', e => {
            touchStartY = e.touches[0].clientY;
        }, {passive: true});
        
        handleEl.addEventListener('touchmove', e => {
            touchEndY = e.touches[0].clientY;
            const yDiff = touchStartY - touchEndY;
            
            // Swipe down to close panel
            if (yDiff < -50) {
                sidePanel.classList.remove('active');
            }
        }, {passive: true});
    }
    
    // Back to top button functionality
    backToTopBtn.addEventListener('click', () => {
        mainContent.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
    
    // Show/hide back to top button based on scroll position
    mainContent.addEventListener('scroll', () => {
        if (mainContent.scrollTop > 300) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    }, {passive: true});
}

// Load timeline data from the server
async function loadTimeline() {
    try {
        const response = await fetch('/api/timeline');
        timelineData = await response.json();
        
        if (timelineData.length > 0) {
            renderTimeline();
            updatePatientInfo(timelineData[timelineData.length - 1].content);
        } else {
            timeline.innerHTML = '<p class="no-data">No medical records found. Upload .med files or fetch from API.</p>';
        }
    } catch (error) {
        console.error('Error loading timeline:', error);
        timeline.innerHTML = '<p class="error">Error loading timeline. Please try again.</p>';
    }
}

// Load medications in use
async function loadMedicationsInUse() {
    try {
        const response = await fetch('/api/medications-in-use');
        medicationsInUse = await response.json();
        renderMedicationsInUse();
    } catch (error) {
        console.error('Error loading medications:', error);
        medicationsList.innerHTML = '<p class="error">Error loading medications. Please try again.</p>';
    }
}

// Load patient diagnoses
async function loadDiagnoses() {
    try {
        const response = await fetch('/api/diagnoses');
        patientDiagnoses = await response.json();
        renderDiagnoses();
    } catch (error) {
        console.error('Error loading diagnoses:', error);
        diagnosesList.innerHTML = '<p class="error">Error loading diagnoses. Please try again.</p>';
    }
}

// Load changes in diagnoses and medications
async function loadChanges() {
    try {
        const response = await fetch('/api/changes');
        const changes = await response.json();
        
        diagnosisChanges = changes.diagnosis_changes;
        medicationChanges = changes.medication_changes;
        
        renderChanges();
        
        // Update tab badges if there are changes
        updateChangeBadges();
    } catch (error) {
        console.error('Error loading changes:', error);
        diagnosisChangesList.innerHTML = '<p class="error">Error loading diagnosis changes.</p>';
        medicationChangesList.innerHTML = '<p class="error">Error loading medication changes.</p>';
    }
}

// Update badges on tabs to indicate new changes
function updateChangeBadges() {
    const changesTab = document.querySelector('.tab-btn[data-tab="changes"]');
    
    if (diagnosisChanges.length > 0 || medicationChanges.length > 0) {
        // Create badge if it doesn't exist
        if (!changesTab.querySelector('.badge')) {
            const badge = document.createElement('span');
            badge.className = 'badge';
            changesTab.appendChild(badge);
        }
    } else {
        // Remove badge if no changes
        const badge = changesTab.querySelector('.badge');
        if (badge) {
            badge.remove();
        }
    }
}

// Render the timeline with all encounters
function renderTimeline() {
    // Clear loading indicator
    timeline.innerHTML = '';
    
    // Sort timeline by timestamp
    timelineData.sort((a, b) => new Date(a.content.timestamp) - new Date(b.content.timestamp));
    
    // Create timeline items
    timelineData.forEach((item, index) => {
        const encounter = item.content;
        const date = new Date(encounter.timestamp);
        
        const timelineItem = document.createElement('div');
        timelineItem.className = 'timeline-item';
        timelineItem.dataset.index = index;
        
        // Format the date
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        // Create med conducts tags
        let medTags = '';
        const conducts = encounter.medical_conducts;
        
        if (conducts.prescriptions && conducts.prescriptions.length > 0) {
            conducts.prescriptions.forEach(prescription => {
                medTags += `<span class="med-tag">Rx: ${prescription}</span>`;
            });
        }
        
        if (conducts.exam_requests && conducts.exam_requests.length > 0) {
            const examCount = conducts.exam_requests.length;
            medTags += `<span class="med-tag">Exams: ${examCount}</span>`;
        }
        
        if (conducts.referrals && conducts.referrals.length > 0) {
            const referralCount = conducts.referrals.length;
            medTags += `<span class="med-tag">Referrals: ${referralCount}</span>`;
        }
        
        timelineItem.innerHTML = `
            <div class="timeline-date">${formattedDate}</div>
            <div class="timeline-card" onclick="showEncounterDetails(${index})">
                <h3>${encounter.diagnosis}</h3>
                <p>Medical conducts: ${conducts.prescriptions?.length || 0} prescriptions, 
                   ${conducts.exam_requests?.length || 0} exams, 
                   ${conducts.referrals?.length || 0} referrals</p>
                <div class="med-conducts">
                    ${medTags}
                </div>
            </div>
        `;
        
        timeline.appendChild(timelineItem);
    });
}

// Render medications in use
function renderMedicationsInUse() {
    // Clear loading indicator
    medicationsList.innerHTML = '';
    
    if (medicationsInUse.length === 0) {
        medicationsList.innerHTML = '<p class="no-data">No medications in use.</p>';
        return;
    }
    
    // Sort medications by name
    const sortedMeds = [...medicationsInUse].sort((a, b) => a.name.localeCompare(b.name));
    
    // Create medication items
    sortedMeds.forEach(med => {
        const medicationItem = document.createElement('div');
        medicationItem.className = 'medication-item';
        
        const date = new Date(med.date_added);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
        
        medicationItem.innerHTML = `
            <div class="medication-info">
                <div class="medication-name">${med.name}</div>
                <div class="medication-date">Added: ${formattedDate}</div>
            </div>
            <div class="medication-status">
                <span class="medication-badge ${med.regular_use ? 'badge-regular' : 'badge-temporary'}">
                    ${med.regular_use ? 'Regular Use' : 'Temporary'}
                </span>
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-regular-use" data-medication="${med.name}" ${med.regular_use ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        medicationsList.appendChild(medicationItem);
    });
    
    // Add event listeners to toggle switches
    document.querySelectorAll('.toggle-regular-use').forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            const medication = event.target.dataset.medication;
            const isRegular = event.target.checked;
            updateMedicationRegularUse(medication, isRegular);
        });
    });
}

// Render patient diagnoses
function renderDiagnoses() {
    // Clear loading indicator
    diagnosesList.innerHTML = '';
    
    if (patientDiagnoses.length === 0) {
        diagnosesList.innerHTML = '<p class="no-data">No diagnoses recorded.</p>';
        return;
    }
    
    // Sort diagnoses by date diagnosed (newest first)
    const sortedDiagnoses = [...patientDiagnoses].sort((a, b) => 
        new Date(b.date_diagnosed) - new Date(a.date_diagnosed));
    
    // Create diagnosis items
    sortedDiagnoses.forEach(diagnosis => {
        const diagnosisItem = document.createElement('div');
        diagnosisItem.className = 'diagnosis-item';
        
        const date = new Date(diagnosis.date_diagnosed);
        const formattedDate = date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric'
        });
        
        diagnosisItem.innerHTML = `
            <div class="diagnosis-info">
                <div class="diagnosis-name">${diagnosis.name}</div>
                <div class="diagnosis-date">Diagnosed: ${formattedDate}</div>
            </div>
            <div class="diagnosis-status">
                <span class="diagnosis-badge ${diagnosis.active ? 'badge-regular' : 'badge-temporary'}">
                    ${diagnosis.active ? 'Active' : 'Inactive'}
                </span>
                <label class="toggle-switch">
                    <input type="checkbox" class="toggle-active-diagnosis" data-diagnosis="${diagnosis.name}" ${diagnosis.active ? 'checked' : ''}>
                    <span class="toggle-slider"></span>
                </label>
            </div>
        `;
        
        diagnosesList.appendChild(diagnosisItem);
    });
    
    // Add event listeners to toggle switches
    document.querySelectorAll('.toggle-active-diagnosis').forEach(toggle => {
        toggle.addEventListener('change', (event) => {
            const diagnosis = event.target.dataset.diagnosis;
            const isActive = event.target.checked;
            updateDiagnosisActiveStatus(diagnosis, isActive);
        });
    });
}

// Render changes in diagnoses and medications
function renderChanges() {
    // Clear loading indicators
    diagnosisChangesList.innerHTML = '';
    medicationChangesList.innerHTML = '';
    
    // Render diagnosis changes
    if (diagnosisChanges.length === 0) {
        diagnosisChangesList.innerHTML = '<p class="no-data">No new diagnoses.</p>';
    } else {
        diagnosisChanges.forEach(change => {
            // Find the encounter that matches the timestamp
            const encounterItem = timelineData.find(item => 
                item.content.timestamp === change.timestamp);
            
            if (!encounterItem) {
                console.warn(`Encounter not found for diagnosis change: ${change.diagnosis}`);
                return;
            }
            
            // Find the index in the current timeline array
            const encounterIndex = timelineData.indexOf(encounterItem);
            const date = new Date(change.timestamp);
            
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
            
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item new-diagnosis';
            changeItem.innerHTML = `
                <div class="change-date">${formattedDate}</div>
                <div class="change-content">New diagnosis: <strong>${change.diagnosis}</strong></div>
                <div class="change-link">
                    <a href="#" onclick="showEncounterDetails(${encounterIndex}); return false;">
                        View encounter details
                    </a>
                </div>
            `;
            
            diagnosisChangesList.appendChild(changeItem);
        });
    }
    
    // Render medication changes
    if (medicationChanges.length === 0) {
        medicationChangesList.innerHTML = '<p class="no-data">No new medications.</p>';
    } else {
        medicationChanges.forEach(change => {
            // Find the encounter that matches the timestamp
            const encounterItem = timelineData.find(item => 
                item.content.timestamp === change.timestamp);
            
            if (!encounterItem) {
                console.warn(`Encounter not found for medication change: ${change.medication}`);
                return;
            }
            
            // Find the index in the current timeline array
            const encounterIndex = timelineData.indexOf(encounterItem);
            const date = new Date(change.timestamp);
            
            const formattedDate = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric'
            });
            
            const changeItem = document.createElement('div');
            changeItem.className = 'change-item new-medication';
            changeItem.innerHTML = `
                <div class="change-date">${formattedDate}</div>
                <div class="change-content">New medication: <strong>${change.medication}</strong></div>
                <div class="change-actions">
                    <button class="btn btn-small add-to-regular" data-medication="${change.medication}">
                        Add to regular use
                    </button>
                </div>
                <div class="change-link">
                    <a href="#" onclick="showEncounterDetails(${encounterIndex}); return false;">
                        View encounter details
                    </a>
                </div>
            `;
            
            medicationChangesList.appendChild(changeItem);
        });
        
        // Add event listeners to "Add to regular use" buttons
        document.querySelectorAll('.add-to-regular').forEach(button => {
            button.addEventListener('click', (event) => {
                const medication = event.target.dataset.medication;
                currentMedication = medication;
                medicationModal.style.display = 'block';
            });
        });
    }
}

// Update patient information in the summary panel
function updatePatientInfo(latestEncounter) {
    if (!latestEncounter) return;
    
    patientName.textContent = latestEncounter.name || 'Unknown Patient';
    patientAge.textContent = latestEncounter.age ? `Age: ${latestEncounter.age}` : '';
    patientSex.textContent = latestEncounter.sex ? `Sex: ${latestEncounter.sex.charAt(0).toUpperCase() + latestEncounter.sex.slice(1)}` : '';
    
    currentPatient = {
        name: latestEncounter.name,
        age: latestEncounter.age,
        sex: latestEncounter.sex
    };
}

// Show encounter details in the side panel
function showEncounterDetails(index) {
    const encounter = timelineData[index].content;
    const filename = timelineData[index].filename;
    const date = new Date(encounter.timestamp);
    
    // Format the date
    const formattedDate = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Create HTML for the details
    let detailsHTML = `
        <div class="detail-section">
            <h4>General Information</h4>
            <p><strong>Date:</strong> ${formattedDate}</p>
            <p><strong>Diagnosis:</strong> ${encounter.diagnosis}</p>
        </div>
    `;
    
    // Add prescriptions if available
    const prescriptions = encounter.medical_conducts.prescriptions;
    if (prescriptions && prescriptions.length > 0) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Prescriptions</h4>
                <ul class="detail-list">
                    ${prescriptions.map(prescription => `
                        <li>
                            <div class="item-with-actions">
                                <span>${prescription}</span>
                                <div class="item-actions">
                                    <button class="action-btn print-btn" data-type="prescription" data-content="${prescription}" title="Print prescription">
                                        <i class="fas fa-print"></i>
                                    </button>
                                    <button class="action-btn download-btn" data-type="prescription" data-content="${prescription}" title="Download prescription">
                                        <i class="fas fa-download"></i>
                                    </button>
                                    <button class="btn-small add-med-btn" data-medication="${prescription}" title="Add to medications">
                                        <i class="fas fa-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add exam requests if available
    const exams = encounter.medical_conducts.exam_requests;
    if (exams && exams.length > 0) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Exam Requests</h4>
                <ul class="detail-list">
                    ${exams.map(exam => `
                        <li>
                            <div class="item-with-actions">
                                <span>${exam}</span>
                                <div class="item-actions">
                                    <button class="action-btn print-btn" data-type="exam" data-content="${exam}" title="Print exam request">
                                        <i class="fas fa-print"></i>
                                    </button>
                                    <button class="action-btn download-btn" data-type="exam" data-content="${exam}" title="Download exam request">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add referrals if available
    const referrals = encounter.medical_conducts.referrals;
    if (referrals && referrals.length > 0) {
        detailsHTML += `
            <div class="detail-section">
                <h4>Referrals</h4>
                <ul class="detail-list">
                    ${referrals.map(referral => `
                        <li>
                            <div class="item-with-actions">
                                <span>${referral}</span>
                                <div class="item-actions">
                                    <button class="action-btn print-btn" data-type="referral" data-content="${referral}" title="Print referral">
                                        <i class="fas fa-print"></i>
                                    </button>
                                    <button class="action-btn download-btn" data-type="referral" data-content="${referral}" title="Download referral">
                                        <i class="fas fa-download"></i>
                                    </button>
                                </div>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add download button for the full .med file
    detailsHTML += `
        <div class="detail-actions">
            <a href="/download/${filename}" class="btn" download>
                <i class="fas fa-download"></i> Download .med file
            </a>
        </div>
    `;
    
    encounterDetails.innerHTML = detailsHTML;
    
    // On mobile, show the side panel
    if (isMobile) {
        sidePanel.classList.add('active');
    }
    
    // Highlight the selected timeline item
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => item.classList.remove('active'));
    timelineItems[index].classList.add('active');
    
    // Add event listeners to "Add to regular" buttons
    document.querySelectorAll('.add-med-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const medication = event.target.closest('.add-med-btn').dataset.medication;
            currentMedication = medication;
            medicationModal.style.display = 'block';
        });
    });
    
    // Add event listeners to print buttons
    document.querySelectorAll('.print-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const type = event.target.closest('.print-btn').dataset.type;
            const content = event.target.closest('.print-btn').dataset.content;
            printDocument(type, content, encounter);
        });
    });
    
    // Add event listeners to download buttons
    document.querySelectorAll('.download-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const type = event.target.closest('.download-btn').dataset.type;
            const content = event.target.closest('.download-btn').dataset.content;
            downloadDocument(type, content, encounter);
        });
    });
}

// Print a document for medical conducts
function printDocument(type, content, encounter) {
    const date = new Date(encounter.timestamp);
    const formattedDate = date.toLocaleDateString();
    
    let printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>${type.charAt(0).toUpperCase() + type.slice(1)} - ${content}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    margin: 20px;
                }
                .header {
                    text-align: center;
                    margin-bottom: 20px;
                    padding-bottom: 10px;
                    border-bottom: 1px solid #ccc;
                }
                .content {
                    margin-bottom: 30px;
                }
                .footer {
                    margin-top: 50px;
                    text-align: center;
                    font-size: 0.8em;
                    color: #666;
                }
                @media print {
                    button {
                        display: none;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h2>${type.charAt(0).toUpperCase() + type.slice(1)}</h2>
                <p>Patient: ${encounter.name || 'Unknown'}</p>
                <p>Date: ${formattedDate}</p>
            </div>
            <div class="content">
                <h3>${content}</h3>
            </div>
            <div class="footer">
                <p>Generated by Patient Timeline</p>
            </div>
            <button onclick="window.print(); window.close();" style="margin-top: 20px;">
                Print Document
            </button>
        </body>
        </html>
    `);
    printWindow.document.close();
}

// Download a document for medical conducts
function downloadDocument(type, content, encounter) {
    const date = new Date(encounter.timestamp);
    const formattedDate = date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\//g, '-');
    
    const filename = `${type}_${content.replace(/\s/g, '_')}_${formattedDate}.txt`;
    
    const text = `
${type.toUpperCase()}: ${content}
Patient: ${encounter.name || 'Unknown'}
Date: ${date.toLocaleDateString()}

Generated by Patient Timeline
    `.trim();
    
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 100);
}

// Update a medication's regular use status
async function updateMedicationRegularUse(medicationName, isRegular) {
    try {
        const response = await fetch('/api/medications-in-use', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: medicationName,
                regular_use: isRegular
            })
        });
        
        if (response.ok) {
            // Update local state
            medicationsInUse.forEach(med => {
                if (med.name === medicationName) {
                    med.regular_use = isRegular;
                }
            });
            
            // Re-render medications list
            renderMedicationsInUse();
        } else {
            console.error('Failed to update medication status');
        }
    } catch (error) {
        console.error('Error updating medication status:', error);
    }
}

// Update a diagnosis's active status
async function updateDiagnosisActiveStatus(diagnosisName, isActive) {
    try {
        const response = await fetch('/api/diagnoses', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: diagnosisName,
                active: isActive
            })
        });
        
        if (response.ok) {
            // Update local state
            patientDiagnoses.forEach(diag => {
                if (diag.name === diagnosisName) {
                    diag.active = isActive;
                }
            });
            
            // Re-render diagnoses list
            renderDiagnoses();
        } else {
            console.error('Failed to update diagnosis status');
        }
    } catch (error) {
        console.error('Error updating diagnosis status:', error);
    }
}

// Add a medication to regular use
async function addMedicationToRegularUse(medicationName, isRegular) {
    try {
        const response = await fetch('/api/medications-in-use/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: medicationName,
                regular_use: isRegular
            })
        });
        
        if (response.ok) {
            // Reload medications
            await loadMedicationsInUse();
            
            // Show medications tab
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            document.querySelector('.tab-btn[data-tab="medications"]').classList.add('active');
            document.getElementById('medications-tab').classList.add('active');
        } else {
            console.error('Failed to add medication');
        }
    } catch (error) {
        console.error('Error adding medication:', error);
    }
}

// Handle file upload
async function handleFileUpload(event) {
    const files = event.target.files;
    
    if (files.length === 0) return;
    
    const formData = new FormData();
    
    for (let i = 0; i < files.length; i++) {
        formData.append('file', files[i]);
    }
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
            uploadMessage.textContent = result.message;
            uploadModal.style.display = 'block';
            
            // Reload all data
            loadTimeline();
            loadMedicationsInUse();
            loadDiagnoses();
            loadChanges();
        } else {
            uploadMessage.textContent = result.error || 'Upload failed';
            uploadModal.style.display = 'block';
        }
    } catch (error) {
        console.error('Error uploading files:', error);
        uploadMessage.textContent = 'Error uploading files. Please try again.';
        uploadModal.style.display = 'block';
    }
    
    // Reset the file input
    event.target.value = '';
}

// Fetch data from the API
async function fetchFromApi() {
    fetchApiBtn.disabled = true;
    fetchApiBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Fetching...';
    
    try {
        const response = await fetch('/api/fetch', {
            method: 'POST'
        });
        
        const result = await response.json();
        
        uploadMessage.textContent = result.message;
        uploadModal.style.display = 'block';
        
        // Reload all data after a short delay
        setTimeout(() => {
            loadTimeline();
            loadMedicationsInUse();
            loadDiagnoses();
            loadChanges();
        }, 2000);
    } catch (error) {
        console.error('Error fetching from API:', error);
        uploadMessage.textContent = 'Error fetching from API. Please try again.';
        uploadModal.style.display = 'block';
    } finally {
        fetchApiBtn.disabled = false;
        fetchApiBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> Fetch from API';
    }
}

// Make functions globally available
window.showEncounterDetails = showEncounterDetails;
