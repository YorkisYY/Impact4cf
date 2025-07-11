import { TextField, InputAdornment } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import {useState, useEffect} from 'react';
import SearchBarProps from '@/types/user-list-search-bar';



export default function SearchBar({ searchText, onSearch }: SearchBarProps) {

    const [searchedText, setSearchedText] = useState<string>(searchText);

    function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
        const val = e.target.value;
        setSearchedText(val);
        onSearch(val);
    }




  return (
    <TextField

      variant="outlined"
      placeholder="Search Username..."
      onChange={handleChange}
      value={searchedText}

      slotProps={{
        input: {
            startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#697586' }}/>
                </InputAdornment>
            )
        }
      }}
      sx={{
        color: '#697586',
        backgroundColor: '#F8FAFC',

        //removes outline focus, double check that this is a good call in terms of access
        '& .MuiOutlinedInput-root': {
          '& fieldset': {
            borderColor: '#E3E8EF', 
          },
          '&:hover fieldset': {
            borderColor: '#E3E8EF', 
          },
          '&.Mui-focused fieldset': {
            borderColor: '#E3E8EF', 
          },
          '&.MuiSvgIcon-root ': {
            borderColor: '#E3E8EF', 
          },
        },
      }}
    />
  );
}

