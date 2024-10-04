import os
import random
import glob
import subprocess
from moviepy.editor import VideoFileClip

def reencode_webm(input_file, output_file):
    # Ensure ffmpeg_command is correctly set up
    ffmpeg_command = ["ffmpeg", "-i", input_file, output_file]  # Check this line
    subprocess.run(ffmpeg_command, check=True)  # Ensure ffmpeg is installed and in PATH

def convert_all_webm_to_mp4():
    downloads_folder = os.path.expanduser('~/Downloads')
    output_folder = os.path.expanduser('~/balls')

    # Ensure the output directory exists
    if not os.path.exists(output_folder):
        os.makedirs(output_folder)

    # Find all .webm files in Downloads
    webm_files = glob.glob(os.path.join(downloads_folder, '*.webm'))

    if not webm_files:
        print("No .webm files found in Downloads.")
        return

    for random_webm in webm_files:
        # Re-encode webm to fix potential metadata issues
        base_name = os.path.basename(random_webm).replace('.webm', '')
        temp_reencoded_webm = os.path.join(downloads_folder, f'reencoded_{base_name}.webm')

        # Re-encode the webm file
        reencode_webm(random_webm, temp_reencoded_webm)

        mp4_file_path = os.path.join(output_folder, os.path.basename(random_webm).replace('.webm', '.mp4'))

        try:
            # Convert to mp4 with maximum quality settings
            with VideoFileClip(temp_reencoded_webm) as video:
                video.write_videofile(
                    mp4_file_path,
                    codec='libx264',
                    audio_codec='aac',
                    bitrate='8000k',  # Set a high bitrate for better quality
                    fps=video.fps,    # Use the original frame rate
                    preset='veryslow', # Use 'veryslow' preset for better compression
                    ffmpeg_params=['-crf', '18']  # Set CRF for high quality (lower is better)
                )
            
            # Remove the original .webm file after successful conversion
            os.remove(random_webm)
            print(f"Converted {random_webm} to {mp4_file_path} and removed the original file.")
        
        except Exception as e:
            print(f"An error occurred during conversion of {random_webm}: {e}")

        # Clean up temporary re-encoded file
        if os.path.exists(temp_reencoded_webm):
            os.remove(temp_reencoded_webm)

# Call the new function
convert_all_webm_to_mp4()
