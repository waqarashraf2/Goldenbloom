import os
import glob

def configure():
    print("Listing files in android/app:")
    for f in glob.glob("android/app/*"):
        print(" -", f)

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

        with open(manifest_path, "w", encoding="utf-8") as f:
            f.write(m)
        print("Configured AndroidManifest.xml")

if __name__ == "__main__":
    configure()
