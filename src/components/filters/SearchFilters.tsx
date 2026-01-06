import { useState } from 'react';
import { Search, Filter, X, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

export interface FilterValues {
  search: string;
  skills: string[];
  categories: string[];
  location: string;
  internshipType: string;
  workMode: string;
  sortBy: string;
}

interface SearchFiltersProps {
  filters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  showSubscribe?: boolean;
  onSubscribe?: () => void;
}

const skillOptions = [
  'React', 'Python', 'JavaScript', 'TypeScript', 'Java', 'Node.js',
  'SQL', 'AWS', 'Machine Learning', 'Data Analysis', 'UI/UX Design',
  'Marketing', 'Content Writing', 'Project Management'
];

const categoryOptions = [
  'Technology', 'Marketing', 'Design', 'Finance', 'HR',
  'Sales', 'Operations', 'Research', 'Engineering'
];

const locationOptions = [
  'New York', 'San Francisco', 'Los Angeles', 'Chicago',
  'Boston', 'Seattle', 'Austin', 'Remote', 'Any Location'
];

export const SearchFilters = ({
  filters,
  onFilterChange,
  showSubscribe = true,
  onSubscribe,
}: SearchFiltersProps) => {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const handleSearchChange = (value: string) => {
    onFilterChange({ ...filters, search: value });
  };

  const handleSkillToggle = (skill: string) => {
    const newSkills = filters.skills.includes(skill)
      ? filters.skills.filter((s) => s !== skill)
      : [...filters.skills, skill];
    onFilterChange({ ...filters, skills: newSkills });
  };

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter((c) => c !== category)
      : [...filters.categories, category];
    onFilterChange({ ...filters, categories: newCategories });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      skills: [],
      categories: [],
      location: '',
      internshipType: '',
      workMode: '',
      sortBy: 'newest',
    });
  };

  const activeFilterCount =
    filters.skills.length +
    filters.categories.length +
    (filters.location ? 1 : 0) +
    (filters.internshipType ? 1 : 0) +
    (filters.workMode ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Search Bar Row */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search internships, companies, skills..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="gradient-primary border-0">
          <Search className="h-4 w-4 mr-2" />
          Search
        </Button>
        {showSubscribe && (
          <Button variant="outline" onClick={onSubscribe}>
            Subscribe
          </Button>
        )}
      </div>

      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Mobile Filter Sheet */}
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden">
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center gradient-primary border-0">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-80">
            <SheetHeader>
              <SheetTitle>Filters</SheetTitle>
            </SheetHeader>
            <div className="mt-6 space-y-6">
              {/* Skills */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Skills</Label>
                <div className="flex flex-wrap gap-2">
                  {skillOptions.map((skill) => (
                    <Badge
                      key={skill}
                      variant={filters.skills.includes(skill) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        filters.skills.includes(skill) ? 'gradient-primary border-0' : ''
                      }`}
                      onClick={() => handleSkillToggle(skill)}
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Categories</Label>
                <div className="flex flex-wrap gap-2">
                  {categoryOptions.map((category) => (
                    <Badge
                      key={category}
                      variant={filters.categories.includes(category) ? 'default' : 'outline'}
                      className={`cursor-pointer ${
                        filters.categories.includes(category) ? 'gradient-secondary border-0' : ''
                      }`}
                      onClick={() => handleCategoryToggle(category)}
                    >
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Location */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Location</Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) => onFilterChange({ ...filters, location: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locationOptions.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Internship Type */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Internship Type</Label>
                <Select
                  value={filters.internshipType}
                  onValueChange={(value) => onFilterChange({ ...filters, internshipType: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="stipended">Stipended</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Work Mode */}
              <div>
                <Label className="text-sm font-medium mb-3 block">Work Mode</Label>
                <Select
                  value={filters.workMode}
                  onValueChange={(value) => onFilterChange({ ...filters, workMode: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="onsite">On-site</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button variant="ghost" onClick={clearFilters} className="w-full">
                Clear all filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>

        {/* Desktop Filters */}
        <div className="hidden md:flex flex-wrap gap-3">
          <Select
            value={filters.location}
            onValueChange={(value) => onFilterChange({ ...filters, location: value })}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Location" />
            </SelectTrigger>
            <SelectContent>
              {locationOptions.map((location) => (
                <SelectItem key={location} value={location}>
                  {location}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.internshipType}
            onValueChange={(value) => onFilterChange({ ...filters, internshipType: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="stipended">Stipended</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.workMode}
            onValueChange={(value) => onFilterChange({ ...filters, workMode: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Work Mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="remote">Remote</SelectItem>
              <SelectItem value="onsite">On-site</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={filters.sortBy}
            onValueChange={(value) => onFilterChange({ ...filters, sortBy: value })}
          >
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="stipend_high">Highest Stipend</SelectItem>
              <SelectItem value="stipend_low">Lowest Stipend</SelectItem>
            </SelectContent>
          </Select>

          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="h-4 w-4 mr-1" />
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Active Filters Display */}
      {(filters.skills.length > 0 || filters.categories.length > 0) && (
        <div className="flex flex-wrap gap-2">
          {filters.skills.map((skill) => (
            <Badge
              key={skill}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleSkillToggle(skill)}
            >
              {skill}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
          {filters.categories.map((category) => (
            <Badge
              key={category}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => handleCategoryToggle(category)}
            >
              {category}
              <X className="h-3 w-3 ml-1" />
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};
