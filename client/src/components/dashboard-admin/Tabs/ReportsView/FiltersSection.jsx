import {
  Paper, Typography, Grid, Button, TextField,
  MenuItem, Select, FormControl, InputLabel
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon
} from '@mui/icons-material';

const FiltersSection = ({ filters, handleFilterChange, applyFilters, clearFilters, isLoading }) => {
  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
        Filters
      </Typography>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Status</InputLabel>
            <Select
              value={filters.status}
              label="Status"
              onChange={(e) => handleFilterChange('status', e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="under_review">Under Review</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Report Type</InputLabel>
            <Select
              value={filters.report_type}
              label="Report Type"
              onChange={(e) => handleFilterChange('report_type', e.target.value)}
              disabled={isLoading}
            >
              <MenuItem value="">All Types</MenuItem>
              <MenuItem value="spam">Spam</MenuItem>
              <MenuItem value="harassment">Harassment</MenuItem>
              <MenuItem value="hate_speech">Hate Speech</MenuItem>
              <MenuItem value="inappropriate">Inappropriate</MenuItem>
              <MenuItem value="copyright">Copyright</MenuItem>
              <MenuItem value="false_info">False Info</MenuItem>
              <MenuItem value="nudity_content">Nudity</MenuItem>
              <MenuItem value="other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="From Date"
            type="date"
            value={filters.date_from}
            onChange={(e) => handleFilterChange('date_from', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={2}>
          <TextField
            fullWidth
            size="small"
            label="To Date"
            type="date"
            value={filters.date_to}
            onChange={(e) => handleFilterChange('date_to', e.target.value)}
            InputLabelProps={{ shrink: true }}
            disabled={isLoading}
          />
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<FilterIcon />}
            onClick={applyFilters}
            disabled={isLoading}
          >
            Apply
          </Button>
        </Grid>
        <Grid item xs={12} sm={1}>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            disabled={isLoading}
          >
            Clear
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default FiltersSection;