import os
import glob
import shutil

def setup_icons():
    """Copy Golden Bloom branded launcher icons into Android mipmap & drawable folders."""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    icons_src = os.path.join(script_dir, "assets", "icons")
    res_dst = os.path.join(script_dir, "android", "app", "src", "main", "res")

    print(f"Setting up Golden Bloom icons from {icons_src} to {res_dst}...")

    # If Pillow is available, regenerate fresh icons directly from assets/images/logo.png
    try:
        from generate_icons import generate
        generate()
        print("Regenerated brand icons via generate_icons.py")
    except Exception as e:
        print(f"Pillow generation skipped or failed ({e}); falling back to copying assets/icons...")

    if os.path.exists(icons_src) and os.path.exists(res_dst):
        for item in os.listdir(icons_src):
            s = os.path.join(icons_src, item)
            d = os.path.join(res_dst, item)
            if os.path.isdir(s):
                os.makedirs(d, exist_ok=True)
                for f in os.listdir(s):
                    sf = os.path.join(s, f)
                    df = os.path.join(d, f)
                    shutil.copy2(sf, df)
                    print(f"Copied icon {item}/{f} -> {df}")
            else:
                shutil.copy2(s, d)
                print(f"Copied file {item} -> {d}")
        print("Brand icons copied successfully into android res directories!")
    else:
        print(f"Warning: Source icons {icons_src} or dest {res_dst} not found.")

def configure():
    print("Listing files in android/app:")
    for f in glob.glob("android/app/*"):
        print(" -", f)

    # Copy and setup Golden Bloom Launcher Icons
    setup_icons()

    # Check for Groovy build.gradle
    groovy_path = "android/app/build.gradle"
    kts_path = "android/app/build.gradle.kts"

    if os.path.exists(groovy_path):
        with open(groovy_path, "r", encoding="utf-8") as f:
            c = f.read()

        if "coreLibraryDesugaring" not in c:
            if "compileOptions {" in c:
                c = c.replace(
                    "compileOptions {",
                    "compileOptions {\n        coreLibraryDesugaringEnabled true"
                )
            if "defaultConfig {" in c:
                c = c.replace(
                    "defaultConfig {",
                    "defaultConfig {\n        multiDexEnabled true"
                )
            # Ensure minSdkVersion is at least 23
            c = c.replace("minSdk = flutter.minSdkVersion", "minSdk = 23")
            c = c.replace("minSdkVersion flutter.minSdkVersion", "minSdkVersion 23")

            if "dependencies {" in c:
                c = c.replace(
                    "dependencies {",
                    'dependencies {\n    coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.0.4"\n    implementation "androidx.multidex:multidex:2.0.1"'
                )
            else:
                c += '\ndependencies {\n    coreLibraryDesugaring "com.android.tools:desugar_jdk_libs:2.0.4"\n    implementation "androidx.multidex:multidex:2.0.1"\n}\n'

        with open(groovy_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Configured Groovy build.gradle")

    elif os.path.exists(kts_path):
        with open(kts_path, "r", encoding="utf-8") as f:
            c = f.read()

        if "coreLibraryDesugaring" not in c:
            if "compileOptions {" in c:
                c = c.replace(
                    "compileOptions {",
                    "compileOptions {\n        isCoreLibraryDesugaringEnabled = true"
                )
            if "defaultConfig {" in c:
                c = c.replace(
                    "defaultConfig {",
                    "defaultConfig {\n        multiDexEnabled = true"
                )
            c = c.replace("minSdk = flutter.minSdkVersion", "minSdk = 23")

            if "dependencies {" in c:
                c = c.replace(
                    "dependencies {",
                    'dependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")\n    implementation("androidx.multidex:multidex:2.0.1")'
                )
            else:
                c += '\ndependencies {\n    coreLibraryDesugaring("com.android.tools:desugar_jdk_libs:2.0.4")\n    implementation("androidx.multidex:multidex:2.0.1")\n}\n'

        with open(kts_path, "w", encoding="utf-8") as f:
            f.write(c)
        print("Configured Kotlin build.gradle.kts")

    # Configure AndroidManifest.xml
    manifest_path = "android/app/src/main/AndroidManifest.xml"
    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            m = f.read()

        perms = """
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.WAKE_LOCK" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
"""
        if "POST_NOTIFICATIONS" not in m:
            m = m.replace("<application", perms + "\n    <application")
        if "usesCleartextTraffic" not in m:
            m = m.replace("<application", '<application android:usesCleartextTraffic="true"')
        if 'android:label="' in m:
            import re
            m = re.sub(r'android:label="[^"]*"', 'android:label="Golden Bloom CRM"', m)
        if 'android:icon="' not in m:
            m = m.replace("<application", '<application android:icon="@mipmap/ic_launcher"')
        if 'android:roundIcon="' not in m:
            m = m.replace("<application", '<application android:roundIcon="@mipmap/ic_launcher_round"')

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(m)
        print("Configured AndroidManifest.xml with brand icons and permissions")

if __name__ == "__main__":
    configure()
