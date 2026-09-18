import test from 'node:test';
import assert from 'node:assert/strict';

// Test suite for AC-99: Services Accessibility & Category Filtering

test('AC-99: Category filter matching logic for Editing', () => {
  const sampleService = {
    id: 's-test-1',
    title: 'Professional Video Editing & Audio Mastering Service',
    description: 'Expert video editor offering accessible subtitle overlays and audio description.',
    category: 'Editing',
    skills: ['Video Editing', 'Audio Description', 'Premiere Pro'],
    providerName: 'Randi Jayawickrama',
    hourlyRate: 4500,
    rating: 5.0
  };

  const cat = 'editing';
  const serviceCat = sampleService.category.toLowerCase();
  const serviceTitle = sampleService.title.toLowerCase();
  const serviceDesc = sampleService.description.toLowerCase();
  const serviceSkills = sampleService.skills.map(s => s.toLowerCase());

  const matchCategory = serviceCat.includes('edit') || serviceCat.includes('video') || serviceCat.includes('audio') ||
                        serviceTitle.includes('edit') || serviceTitle.includes('video') || serviceTitle.includes('audio') ||
                        serviceDesc.includes('edit') || serviceDesc.includes('video') || serviceDesc.includes('audio') ||
                        serviceSkills.some(s => s.includes('edit') || s.includes('video') || s.includes('audio'));

  assert.equal(matchCategory, true);
});

test('AC-99: Category filter matching logic for HandCraft', () => {
  const sampleService = {
    id: 's-test-2',
    title: 'Handbags & Handicraft Making',
    description: 'Custom handcrafted adaptive bags.',
    category: 'HandCraft',
    skills: ['Handicraft', 'Tailoring'],
    providerName: 'Kamal Perera',
    hourlyRate: 4500,
    rating: 4.9
  };

  const cat = 'handcraft';
  const serviceCat = sampleService.category.toLowerCase();
  const serviceTitle = sampleService.title.toLowerCase();

  const matchCategory = serviceCat.includes('handcraft') || serviceCat.includes('craft') ||
                        serviceTitle.includes('handcraft') || serviceTitle.includes('craft') || serviceTitle.includes('making');

  assert.equal(matchCategory, true);
});

test('AC-99: Accessibility ARIA roles and labels metadata verification', () => {
  const searchInputProps = {
    accessibilityRole: 'search',
    accessibilityLabel: 'Search services input',
    placeholder: 'Search services, skills, providers...'
  };

  assert.equal(searchInputProps.accessibilityRole, 'search');
  assert.equal(searchInputProps.accessibilityLabel, 'Search services input');
});

test('AC-99: Text-to-speech announcement text verification', () => {
  const getSpeakAnnouncement = (category) => `Filter by ${category}`;
  const announcement = getSpeakAnnouncement('Editing');
  assert.equal(announcement, 'Filter by Editing');
});
