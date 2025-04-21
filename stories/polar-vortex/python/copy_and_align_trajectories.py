import argparse
from datetime import datetime, timedelta
from pathlib import Path
import shutil
from align_trajectories import process_files

def copy_trajectory_files(start_date, end_date, source_dir, target_dir):
    """Copy trajectory files for the given date range to target directory."""
    # Create target directory if it doesn't exist
    target_dir = Path(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Convert dates to datetime objects
    current_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')
    
    # Track copied files
    copied_files = []
    
    while current_date <= end_date:
        # Format the date string as it appears in trajectory filenames
        date_str = f"{current_date.strftime('%Y-%m-%d')}T00:00:00.000000000"
        
        # Source file path
        source_file = Path(source_dir) / f"jetstream_traj_{date_str}.csv"
        
        if source_file.exists():
            # Target file path
            target_file = target_dir / source_file.name
            
            # Copy the file
            shutil.copy2(source_file, target_file)
            print(f"Copied {source_file.name} to {target_dir}")
            copied_files.append(target_file)
        else:
            print(f"Warning: No trajectory file found for {current_date.date()}")
        
        # Move to next day using timedelta
        current_date += timedelta(days=1)
    
    return len(copied_files) > 0

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Copy and align jet stream trajectory files.')
    parser.add_argument('--start-date', type=str, required=True,
                      help='Start date in YYYY-MM-DD format')
    parser.add_argument('--end-date', type=str, required=True,
                      help='End date in YYYY-MM-DD format')
    parser.add_argument('--source-dir', type=str, required=True,
                      help='Source directory containing original trajectory files')
    parser.add_argument('--target-dir', type=str, required=True,
                      help='Target directory for copied and aligned files')
    
    args = parser.parse_args()
    
    # First, copy the files
    print("\nCopying trajectory files...")
    files_copied = copy_trajectory_files(
        args.start_date,
        args.end_date,
        args.source_dir,
        args.target_dir
    )
    
    if files_copied:
        # Then run the alignment process
        print("\nAligning trajectories...")
        process_files(args.target_dir)
        print("\nProcess complete!") 