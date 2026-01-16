# Heart Disease Multivariate Dashboard - Implementation Report
## 4DV806 Assignment 3 - Advanced Information Visualization and Applications

**Course**: 4DV806 - Autumn 2024  
**Assignment**: Assignment 3 - Multivariate Visualization Implementation  
**Date**: January 2026

---

## 1. Introduction

This report describes the implementation of an interactive multivariate visualization dashboard for heart disease patient data. The dashboard was developed using D3.js (version 7) and implements multiple coordinated views to support exploratory data analysis of a UCI heart disease dataset containing 303 patient records with 14 attributes.

---

## 2. User Interaction and Task Support

### 2.1 Browsing Tasks

The dashboard supports comprehensive data browsing through multiple mechanisms:

- **Filter Controls**: Users can browse different data subsets using:
  - Sex dropdown selector (All/Male/Female)
  - Age range sliders (minimum and maximum age from 20-80 years)
  - Outcome bar chart click filtering (Heart disease / No heart disease)

- **Variable Selection**: The scatterplot allows users to select different variable pairs for the X and Y axes from six continuous variables: age, resting blood pressure (trestbps), cholesterol (chol), maximum heart rate (thalach), ST depression (oldpeak), and number of major vessels (ca).

- **Visual Overview**: The outcome bar chart provides an immediate overview of the dataset distribution between patients with and without heart disease.

### 2.2 Highlighting Tasks

Multiple highlighting mechanisms are implemented:

- **Interactive Brushing**: Users can drag a rectangular selection box (marquee selection) on the scatterplot to select multiple patients at once. The brushed region automatically populates the Patient Details comparison table below with the selected patients' information.

- **Click-based Filtering**: Clicking on bars in the outcome overview chart highlights only patients in that category across all views, with non-selected categories shown at reduced opacity (0.35).

- **Patient Selection**: Individual points in the scatterplot can be clicked to add specific patients to the comparison table (up to 6 patients), which are then highlighted with a white stroke border. Clicking on empty space in the scatterplot clears all selections and refreshes the view.

### 2.3 Comparison of Entries

The dashboard supports detailed patient comparison through:

- **Patient Details Table**: Up to 6 selected patients (via brushing or clicking in the scatterplot) are displayed side-by-side in a comparison table showing all 14 attributes including: sex, age, chest pain type, blood pressure, cholesterol, fasting blood sugar, resting ECG results, maximum heart rate, exercise-induced angina, ST depression, slope, number of vessels, thalassemia type, and outcome.

- **Brush Selection for Comparison**: Users can drag a rectangular selection (brush) on the scatterplot to automatically select multiple patients within that region for comparison. Clicking on empty space clears all selections.

- **Visual Comparison**: The scatterplot allows visual comparison of patients across any two selected continuous variables, with color encoding showing outcome status.

- **Small Multiples**: Four histograms display distributions of key variables (age, blood pressure, cholesterol, max heart rate) with stacked bars showing outcome categories, enabling visual comparison across variables.

### 2.4 Filtering Tasks

Multiple coordinated filtering mechanisms:

- **Demographic Filters**: Sex and age range filters update all views in real-time
- **Outcome Filter**: Clicking outcome categories filters the entire dataset
- **Brush Selection**: Brushing in the scatterplot selects patients and populates the comparison table
- **Clear Selection**: Clicking empty space in the scatterplot clears all patient selections and refreshes the view
- **Filter Status Display**: Shows current filter settings and the resulting patient count

---

## 3. Differences from Assignment 2 Design

### 3.1 Technology Change

**Original Design (Assignment 2)**: The initial design was implemented using Vega-Lite, a high-level declarative visualization grammar.

**Final Implementation**: The visualization was completely re-implemented using D3.js, a lower-level JavaScript library providing fine-grained control over DOM manipulation and visualization.

**Rationale**: This change was made to:
- Gain more precise control over interactions and state management
- Better understand the underlying mechanisms of interactive visualizations
- Demonstrate proficiency with both declarative and imperative visualization approaches

### 3.2 Layout Refinements

- **Control Panel**: Added a dedicated control section at the top with clearly labeled filter controls
- **Filter Status Display**: Replaced the static text panel with a dynamic status display showing current filters and patient count
- **Responsive Design**: Improved CSS grid layout for better responsiveness across screen sizes

### 3.3 Interaction Enhancements

- **State Management**: Implemented a centralized state object managing all filter parameters and selections
- **Linked Updates**: All views update synchronously when any filter or selection changes
- **Visual Feedback**: Enhanced hover states and cursor indicators for interactive elements

---

## 4. Problems Encountered During Implementation

### 4.1 Technology Migration Challenges

**Problem**: Converting from Vega-Lite's declarative specification to D3.js imperative code required significant restructuring.

**Solution**: Systematically broke down each Vega-Lite view into D3.js components (data transformation, scales, axes, marks, interactions).

### 4.2 State Synchronization

**Problem**: Managing synchronized state across multiple independent views was complex, particularly ensuring all views updated correctly when filters changed.

**Solution**: Implemented a global state object and an `update()` function that triggers complete re-rendering of all views, ensuring consistency.

### 4.3 Data Transformation

**Problem**: The CSV file used column name 'thalch' instead of 'thalach', causing null values initially.

**Solution**: Added explicit data mapping during CSV loading to handle column name variations and convert string values to appropriate numeric or categorical types.

### 4.4 Brush Interaction Coordination

**Problem**: D3's brush behavior needed careful coordination with point rendering to maintain correct opacity based on multiple selection states (brush, click, filter).

**Solution**: Implemented a priority-based opacity calculation checking: selected patients → brush region → default visibility.

### 4.5 Histogram Stacking

**Problem**: Creating stacked histograms with outcome categories required manual bin calculation and y-offset tracking.

**Solution**: Used D3's bin generator to create histogram bins, then manually iterated through groups to stack bars with cumulative y-offsets.

---

## 5. Advantages and Disadvantages

### 5.1 Advantages

**Multiple Coordinated Views**
- Provides comprehensive exploration through five linked visualizations
- Supports both overview and detail-on-demand analysis patterns

**Rich Interaction Capabilities**
- Multiple interaction techniques (brushing, clicking, filtering, selecting)
- Immediate visual feedback across all views
- Flexible variable selection for scatterplot

**Clear Visual Design**
- Dark theme reduces eye strain and highlights data
- Consistent color encoding (red for heart disease, blue for no disease)
- Clear axis labels and legends

**Performance**
- Efficient rendering with D3.js
- Smooth interactions even with 300+ data points
- Responsive updates across all views

**Accessibility Features**
- Tooltips on hover for detailed information
- Clear visual hierarchy
- Adequate color contrast

### 5.2 Disadvantages

**Limited Scalability**
- Patient comparison limited to 6 patients (screen space constraint)
- Histograms may become cluttered with larger datasets
- No data aggregation for very large datasets

**Missing Features**
- No animation transitions between states
- Limited tooltip information on histograms
- No export/save functionality for selections
- No undo/redo for interaction history

**Complexity for Novice Users**
- Multiple interaction techniques may be overwhelming initially
- No embedded tutorial or help system
- Requires understanding of medical variables

**Technical Limitations**
- Requires modern browser with JavaScript enabled
- No mobile optimization (designed for desktop)
- Static dataset (no dynamic data loading)

**Visual Density**
- With many filters active, some views may show very few points
- Scatterplot can have overplotting with default point size
- Small multiples histograms are compact, limiting detail

---

## 6. Conclusion

The implemented Heart Disease Multivariate Dashboard successfully demonstrates multiple coordinated views with rich interactive capabilities for exploring patient data. The D3.js implementation provides fine-grained control over all visual and interactive elements, enabling sophisticated linked interactions across views.

The dashboard effectively supports core exploratory tasks including browsing, highlighting, filtering, and comparison. While there are areas for potential enhancement (animations, mobile support, advanced analytics), the current implementation provides a robust foundation for heart disease data analysis.

The conversion from Vega-Lite to D3.js provided valuable learning about the trade-offs between declarative and imperative visualization approaches, with D3.js offering greater flexibility at the cost of increased implementation complexity.

---

## 7. Technical Details

**Technologies Used:**
- D3.js v7
- HTML5, CSS3, JavaScript (ES6+)
- CSV data format

**Dataset:**
- UCI Heart Disease Dataset
- 303 patient records
- 14 attributes (13 features + 1 target)

**Browser Requirements:**
- Modern browser (Chrome, Firefox, Safari, Edge)
- JavaScript enabled
- Minimum screen resolution: 1200x800

**Repository:**
- GitHub: Tanmoyvst/HeartDashboard
- Branch: main

---

## 8. Screenshots

*Note: Screenshots should be inserted here showing:*
1. Initial dashboard view
2. Filtering in action (age slider, sex filter)
3. Outcome bar chart selection
4. Scatterplot brushing demonstration
5. Patient comparison table with selected patients
6. Different variable selections in scatterplot

---

**End of Report**
